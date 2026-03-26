import { motion } from 'motion/react'
import { ArrowBigRight, Sparkles } from 'lucide-react'
import { BlurText } from './BlurText'
import { DashboardMockup } from './DashboardMockup'
import { HlsVideoBackground } from './HlsVideoBackground'

type HeroProps = {
  videoSrc: string
}

export function Hero({ videoSrc }: HeroProps) {
  const showVideo = Boolean(videoSrc.trim())
  return (
    <motion.section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      {showVideo ? (
        <HlsVideoBackground
          src={videoSrc}
          playbackRate={0.35}
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-35"
        />
      ) : null}

      <div className="absolute inset-0 z-1 bg-black/5" aria-hidden />

      <div
        className="absolute inset-0 z-2 bg-linear-to-b from-landing-bg/80 via-landing-bg/70 to-landing-bg"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12">
        <div className="relative w-full max-w-4xl">
          <div
            className="absolute -inset-10 z-[-1] rounded-full bg-violet-500/25 blur-3xl"
            aria-hidden
          />
          <motion.div
            className="relative mx-auto w-full"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.85, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <DashboardMockup />
          </motion.div>
        </div>

        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <BlurText text="RunMate AI 글로벌 러닝 플랫폼" />

          <motion.p
            className="font-body text-landing-muted max-w-xl text-sm font-light"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            LangGraph 페르소나 멀티 에이전트와 RAMI 오케스트레이터가 의도를 읽고, 마라톤·코스·GPS
            기록·영상 편집까지 한 흐름으로 잇는 러닝 파트너입니다. Stitch와 Tailwind로 빠르게
            다듬고 Supabase로 실시간까지 묶습니다.
          </motion.p>

          <motion.div
            id="cta"
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <motion.a
              href="#핵심기능"
              className="liquid-glass-strong relative z-10 inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-medium text-slate-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
              핵심 기능 보기
            </motion.a>
            <a
              href="#워크플로"
              className="font-body text-landing-muted hover:text-landing-text inline-flex items-center gap-2 text-sm font-light transition-colors"
            >
              Stitch 워크플로
              <ArrowBigRight className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            </a>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
