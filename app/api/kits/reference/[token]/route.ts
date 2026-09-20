import { NextResponse } from 'next/server'

import { kitPartReference } from '@/lib/game/kitBuild'
import { archivePhotoBytes } from '@/lib/kit/archive-dna'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const src = kitPartReference(params.token)
  if (!src) return new NextResponse(null, { status: 404 })
  const body = archivePhotoBytes(src)
  if (!body) return new NextResponse(null, { status: 404 })
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
