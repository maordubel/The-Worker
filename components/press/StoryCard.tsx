import { LogoMark } from '@/components/ui/Logo'
import { PlayerFigure } from '@/components/press/PlayerFigure'

/**
 * כרטיס הסטורי — a 1080×1920 result card, drawn as SVG-in-HTML at exact story size.
 *
 * This is the marketing surface. A game that cannot be posted is a game nobody hears
 * about, and a screenshot of a normal app screen posts badly: it is the wrong shape,
 * it carries navigation the reader does not need, and it says nothing to someone who
 * has never seen the product. So the card is built for the feed, not cropped for it:
 * story ratio, one number big enough to read at thumbnail size, the club's language,
 * and a challenge that names the exact round so the reader can play the same ten.
 *
 * It renders at full 1080×1920 and is scaled down with a transform, so what the user
 * sees is exactly what gets saved — no second layout to keep in sync.
 */

export const STORY_WIDTH = 1080
export const STORY_HEIGHT = 1920

export type StoryData = {
  lamps: number
  perfect: number
  correct: number
  answered: number
  bestStreak: number
  rankHe: string
  seed: number
  /** absolute, so a saved image still leads somewhere */
  url: string
  headlineHe: string
  kickerHe: string
  ctaHe: string
  labels: { lamps: string; streak: string; of: string; rank: string }
}

export function StoryCard({ data }: { data: StoryData }) {
  const share = data.perfect > 0 ? Math.round((data.lamps / data.perfect) * 100) : 0

  return (
    <div
      id="story-card"
      dir="rtl"
      className="tex-paper-night relative overflow-hidden"
      style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}
    >
      {/* the spotlight behind the hero */}
      <div className="tex-spot pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* masthead */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-6 px-16 pt-16">
        <LogoMark size={92} night animate={false} />
        <div className="flex flex-col leading-none">
          <span
            className="misregister font-display font-black text-night-ink"
            style={{ fontSize: 62, letterSpacing: '-0.02em' }}
          >
            <bdi dir="ltr">THE WORKER</bdi>
          </span>
          <span className="mt-2 font-sign text-night-accent" style={{ fontSize: 34 }}>
            {data.kickerHe}
          </span>
        </div>
      </div>

      {/* the double rule under the masthead */}
      <div className="press-rule-double absolute inset-x-16" style={{ top: 190 }} />

      {/* the number, big enough to read as a thumbnail */}
      <div className="absolute inset-x-0 text-center" style={{ top: 250 }}>
        <p className="font-body text-night-inkFaint press-spaced" style={{ fontSize: 26 }}>
          {data.labels.lamps}
        </p>
        <p
          className="misregister font-poster leading-none text-night-accent"
          style={{ fontSize: 400, direction: 'ltr' }}
        >
          {data.lamps}
        </p>
        <p className="font-body text-night-inkDim" style={{ fontSize: 34, direction: 'ltr' }}>
          {data.labels.of} {data.perfect}
        </p>
      </div>

      {/* the rank, stamped */}
      <div className="absolute inset-x-0 text-center" style={{ top: 810 }}>
        <span
          className="inline-block border-[6px] border-night-accent px-10 py-3"
          style={{ transform: 'rotate(-2.4deg)' }}
        >
          <span className="misregister font-display font-black text-night-accent" style={{ fontSize: 78 }}>
            {data.rankHe}
          </span>
        </span>
      </div>

      {/* the figure, wearing the club */}
      <div className="absolute inset-x-0 flex justify-center" style={{ top: 960 }}>
        <PlayerFigure
          kit={{
            primary: 'rgb(var(--p-red))',
            secondary: 'rgb(var(--p-line))',
            trim: 'rgb(var(--p-line))',
            pattern: 'solid',
            collar: 'crew',
            longSleeve: false,
            shorts: 'rgb(var(--p-line))',
            socks: 'rgb(var(--p-red))',
            ink: 'rgb(var(--p-line))',
          }}
          number={data.lamps}
          size={430}
          on="night"
        />
      </div>

      {/* the stat line, with dot leaders — straight off a results page */}
      <div className="absolute inset-x-16" style={{ top: 1410 }}>
        <div className="press-rule-hair" />
        <Row label={data.labels.rank} value={`${share}%`} />
        <Row label={data.labels.streak} value={String(data.bestStreak)} />
        <Row label={data.headlineHe} value={`${data.correct}/${data.answered}`} />
      </div>

      {/* the challenge */}
      <div className="absolute inset-x-0 bottom-0 px-16 pb-16 text-center">
        <p
          className="misregister font-display font-black leading-tight text-night-ink"
          style={{ fontSize: 46 }}
        >
          {data.ctaHe}
        </p>
        <p
          className="mt-4 font-body text-night-inkDim"
          style={{ fontSize: 30, direction: 'ltr', unicodeBidi: 'isolate' }}
        >
          {data.url}
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 py-4">
      <span className="font-body text-night-ink" style={{ fontSize: 34 }}>
        {label}
      </span>
      <span className="press-lead" />
      <span
        className="font-poster text-night-ink"
        style={{ fontSize: 44, direction: 'ltr' }}
      >
        {value}
      </span>
    </div>
  )
}
