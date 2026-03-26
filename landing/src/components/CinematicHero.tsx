import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './CinematicHero.css'

/** Replace via env or edit defaults; add matching files under `public/` for preload. */
const DEFAULT_VIDEO = '/hero-bg.mp4'
const DEFAULT_POSTER = '/hero-poster.jpg'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export type CinematicHeroProps = {
  titleText?: string
  subtitleText?: string
  buttonText?: string
  titleFontFamily?: string
  subtitleFontFamily?: string
  videoSrc?: string
  posterSrc?: string
  /** Playback rate for slow-motion feel (e.g. 0.25–0.5). */
  slowPlaybackRate?: number
  onCtaClick?: () => void
}

export function CinematicHero({
  titleText = '[TITLE TEXT SPECIFIED BY USER]',
  subtitleText = '[SUBTITLE TEXT SPECIFIED BY USER]',
  buttonText = '[BUTTON TEXT SPECIFIED BY USER]',
  titleFontFamily,
  subtitleFontFamily,
  videoSrc = import.meta.env.VITE_HERO_VIDEO_URL ?? DEFAULT_VIDEO,
  posterSrc = import.meta.env.VITE_HERO_POSTER_URL ?? DEFAULT_POSTER,
  slowPlaybackRate = 0.35,
  onCtaClick,
}: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = videoRef.current
    if (!el || !videoSrc || videoFailed || prefersReducedMotion) return

    const applySlow = () => {
      try {
        el.playbackRate = slowPlaybackRate
      } catch {
        /* ignore */
      }
    }

    applySlow()
    el.addEventListener('loadedmetadata', applySlow)
    void el.play().catch(() => setVideoFailed(true))

    return () => {
      el.removeEventListener('loadedmetadata', applySlow)
    }
  }, [videoSrc, slowPlaybackRate, videoFailed, prefersReducedMotion])

  const contentStyle: CSSProperties = {
    ...(titleFontFamily && { ['--hero-title-font' as string]: titleFontFamily }),
    ...(subtitleFontFamily && {
      ['--hero-subtitle-font' as string]: subtitleFontFamily,
    }),
  }

  const showVideo =
    Boolean(videoSrc) && !videoFailed && !prefersReducedMotion

  return (
    <section className="cinematic-hero" aria-label="Hero">
      <div className="cinematic-hero__video-wrap" aria-hidden="true">
        {!showVideo && (
          <div
            className="cinematic-hero__fallback"
            style={
              posterSrc
                ? {
                    backgroundImage: `url("${posterSrc.replace(/"/g, '\\"')}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
        )}
        {showVideo && (
          <video
            ref={videoRef}
            className="cinematic-hero__video"
            src={videoSrc}
            poster={posterSrc}
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
          />
        )}
      </div>
      <div className="cinematic-hero__overlay" aria-hidden="true" />
      <div className="cinematic-hero__content" style={contentStyle}>
        <h1 className="cinematic-hero__title">{titleText}</h1>
        <p className="cinematic-hero__subtitle">{subtitleText}</p>
        <button type="button" className="cinematic-hero__cta" onClick={onCtaClick}>
          <span className="cinematic-hero__cta-glass" aria-hidden="true" />
          <span className="cinematic-hero__cta-label">{buttonText}</span>
        </button>
      </div>
    </section>
  )
}
