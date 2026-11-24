import type {Metadata} from 'next'
import Link from 'next/link'
import {t} from '@/lib/i18n'
import styles from './soon.module.css'

export const metadata: Metadata = {title: t('life.soon.meta'), robots: {index: false, follow: true}}

/** Every LIFE address lands here while LIFE is closed (owner, 24.11.2026); the middleware rewrites them for anyone but the owner. */
export default function LifeComingSoon() {
  return (
    <main id="main" className={styles.soon}>
      <picture className={styles.art}>
        <source media="(min-width: 900px)" srcSet="/life-soon/terrace-1080.webp" />
        <img src="/life-soon/terrace-540.webp" alt="" width={540} height={960} decoding="async" fetchPriority="high" />
      </picture>
      <div className={styles.veil} aria-hidden="true" />
      <section className={styles.copy} aria-labelledby="soon-h">
        <p className={styles.kicker}>{t('life.soon.kicker')}</p>
        <h1 id="soon-h" className={styles.title} dir="ltr">LIFE</h1>
        <p className={styles.stamp}>{t('life.soon.stamp')}</p>
        <p className={styles.line}>{t('life.soon.line')}</p>
        <p className={styles.lede}>{t('life.soon.lede')}</p>
        <p className={styles.status}><span className={styles.dot} aria-hidden="true" />{t('life.soon.status')}</p>
        <nav className={styles.actions}>
          <Link className={styles.primary} href="/">{t('life.soon.home')}</Link>
        </nav>
      </section>
    </main>
  )
}
