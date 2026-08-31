/**
 * THE ONLY FILE THAT KNOWS MEDIAWIKI.
 *
 * House rule (football-data): if a provider field name appears outside this file,
 * the provider is no longer replaceable. Everything below returns neutral shapes.
 *
 * Verify before shipping:  grep -R "api.php\|wikitext\|categorymembers" --exclude-dir=node_modules
 *   → hits allowed only in this file and its test.
 */

import { createHash } from 'node:crypto'
import type { RawPage } from '@/scripts/ingest/lib/types'

export type MediaWikiConfig = {
  /** e.g. https://wiki.red-fans.com */
  baseUrl: string
  /** Politeness delay between requests, ms. */
  delayMs: number
  userAgent: string
  maxPages: number
}

export class MediaWikiAccessError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status: number | null,
  ) {
    super(`${message} — ${url}${status === null ? '' : ` (HTTP ${status})`}`)
    this.name = 'MediaWikiAccessError'
  }
}

export class MediaWikiAdapter {
  constructor(private readonly config: MediaWikiConfig) {}

  get apiUrl(): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/api.php`
  }

  pageUrl(title: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/index.php?title=${encodeURIComponent(
      title.replaceAll(' ', '_'),
    )}`
  }

  /** Titles in a category, following continuation. Namespace filter is caller-supplied. */
  async listCategoryMembers(category: string, namespace = 0): Promise<string[]> {
    const titles: string[] = []
    let cursor: string | undefined

    do {
      const params: Record<string, string> = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: category,
        cmlimit: '500',
        cmnamespace: String(namespace),
        format: 'json',
        formatversion: '2',
      }
      if (cursor) params.cmcontinue = cursor

      const payload = await this.request<{
        query?: { categorymembers?: Array<{ title: string }> }
        continue?: { cmcontinue?: string }
      }>(params)

      for (const member of payload.query?.categorymembers ?? []) titles.push(member.title)
      cursor = payload.continue?.cmcontinue
      if (titles.length >= this.config.maxPages) break
    } while (cursor)

    return titles.slice(0, this.config.maxPages)
  }

  /** Full source text of pages, in batches of 20, with revision ids. */
  async fetchPages(titles: readonly string[]): Promise<RawPage[]> {
    const out: RawPage[] = []

    for (let index = 0; index < titles.length; index += 20) {
      const batch = titles.slice(index, index + 20)
      const payload = await this.request<{
        query?: {
          pages?: Array<{
            pageid?: number
            ns?: number
            title: string
            missing?: boolean
            revisions?: Array<{ revid?: number; slots?: { main?: { content?: string } } }>
          }>
        }
      }>({
        action: 'query',
        prop: 'revisions',
        rvprop: 'ids|content',
        rvslots: 'main',
        titles: batch.join('|'),
        format: 'json',
        formatversion: '2',
      })

      for (const page of payload.query?.pages ?? []) {
        const content = page.revisions?.[0]?.slots?.main?.content
        if (page.missing || content === undefined) continue
        out.push({
          pageId: page.pageid ?? null,
          title: page.title,
          namespace: page.ns ?? 0,
          revisionId: page.revisions?.[0]?.revid ?? null,
          sourceText: content, format: 'wikitext' as const,
          contentHash: createHash('sha256').update(content).digest('hex'),
          fetchedAt: new Date().toISOString(),
          url: this.pageUrl(page.title),
        })
      }
    }

    return out
  }

  private async request<T>(params: Record<string, string>): Promise<T> {
    const url = `${this.apiUrl}?${new URLSearchParams(params).toString()}`
    await sleep(this.config.delayMs)

    let response: Response
    try {
      response = await fetch(url, {
        headers: { 'user-agent': this.config.userAgent, accept: 'application/json' },
      })
    } catch (cause) {
      throw new MediaWikiAccessError(`network failure: ${String(cause)}`, url, null)
    }

    if (!response.ok) {
      throw new MediaWikiAccessError('request rejected', url, response.status)
    }

    const text = await response.text()
    if (text.trimStart().startsWith('<')) {
      // A bot-protection interstitial answers 200 with HTML. Fail loudly.
      throw new MediaWikiAccessError(
        'expected JSON, received HTML (bot protection or wrong endpoint)',
        url,
        response.status,
      )
    }

    return JSON.parse(text) as T
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* -------------------------------------------------- wikitext shape helpers */

/** Named parameters of the first template whose name matches. */
export function extractTemplate(
  wikitext: string,
  templateName: string,
): Record<string, string> | null {
  const start = wikitext.indexOf(`{{${templateName}`)
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let index = start; index < wikitext.length - 1; index += 1) {
    const pair = wikitext.slice(index, index + 2)
    if (pair === '{{') depth += 1
    if (pair === '}}') {
      depth -= 1
      if (depth === 0) {
        end = index
        break
      }
    }
  }
  if (end === -1) return null

  const body = wikitext.slice(start + 2 + templateName.length, end)
  const fields: Record<string, string> = {}

  for (const part of splitTopLevel(body, '|')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    const key = part.slice(0, separator).trim()
    const value = stripMarkup(part.slice(separator + 1))
    if (key) fields[key] = value
  }
  return fields
}

/** Category names declared on a page. */
export function extractCategories(wikitext: string): string[] {
  const out: string[] = []
  const pattern = /\[\[\s*(?:קטגוריה|Category)\s*:\s*([^\]|]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(wikitext)) !== null) {
    const name = match[1]?.trim()
    if (name) out.push(name)
  }
  return out
}

/** Rows of the first wikitable, as cell arrays. Row 0 is the header row. */
export function extractTableRows(wikitext: string): string[][] {
  const start = wikitext.indexOf('{|')
  if (start === -1) return []
  const end = wikitext.indexOf('|}', start)
  if (end === -1) return []

  // Drop the opening `{|` line, then split on row separators. The block before the
  // first `|-` is the header block, so it is kept as row 0 rather than discarded.
  const body = wikitext.slice(start, end).replace(/^\{\|[^\n]*\n?/, '')
  const rows: string[][] = []

  for (const chunk of body.split(/^\|-.*$/m)) {
    const cells: string[] = []
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('|+')) continue // caption
      if (!trimmed.startsWith('|') && !trimmed.startsWith('!')) continue
      const isHeader = trimmed.startsWith('!')
      for (const cell of trimmed.slice(1).split(isHeader ? '!!' : '||')) {
        cells.push(stripMarkup(cell))
      }
    }
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

/** Link targets on a page, in order. */
export function extractLinks(wikitext: string): string[] {
  const out: string[] = []
  const pattern = /\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(wikitext)) !== null) {
    const target = match[1]?.trim()
    if (target && !/^(קטגוריה|Category|קובץ|File|תמונה|Image)\s*:/.test(target)) out.push(target)
  }
  return out
}

/** Plain text of a wikitext fragment: links unwrapped, refs and comments removed. */
export function stripMarkup(fragment: string): string {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/^[!|]\s*(?:[a-z-]+\s*=\s*"[^"]*"\s*)*\|\s*/i, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (let index = 0; index < text.length; index += 1) {
    const pair = text.slice(index, index + 2)
    if (pair === '{{' || pair === '[[') depth += 1
    if (pair === '}}' || pair === ']]') depth -= 1

    const char = text[index] as string
    if (char === separator && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)
  return parts
}
