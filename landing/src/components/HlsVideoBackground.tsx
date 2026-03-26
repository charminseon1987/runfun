import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

type HlsVideoBackgroundProps = {
  src: string
  className?: string
  /** 1 미만이면 시네마틱 슬로모 느낌 (예: 0.35) */
  playbackRate?: number
}

function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url) || url.includes('application/x-mpegURL')
}

export function HlsVideoBackground({
  src,
  className,
  playbackRate = 1,
}: HlsVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    let hls: Hls | null = null

    const applyRate = () => {
      try {
        video.playbackRate = playbackRate
      } catch {
        /* ignore */
      }
    }

    if (isHlsUrl(src)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, applyRate)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      } else {
        console.warn('[HlsVideoBackground] HLS not supported in this browser')
      }
    } else {
      video.src = src
    }

    video.addEventListener('loadedmetadata', applyRate)

    void video.play().catch(() => {
      /* autoplay policies */
    })

    return () => {
      if (hls) {
        hls.off(Hls.Events.MANIFEST_PARSED, applyRate)
        hls.destroy()
      }
      video.removeEventListener('loadedmetadata', applyRate)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src, playbackRate])

  if (!src) return null

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
    />
  )
}
