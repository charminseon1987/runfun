import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

const MENU = ['핵심기능', '에이전트', '스택', '워크플로', '문의'] as const

export function Navbar() {
  return (
    <motion.header
      className="fixed top-4 right-0 left-0 z-50 px-8 py-3"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between">
        <a
          href="#top"
          className="font-heading italic text-landing-text z-10 text-xl tracking-tight md:text-2xl"
        >
          RunMate AI
        </a>

        <nav
          className="liquid-glass absolute left-1/2 z-10 hidden -translate-x-1/2 rounded-2xl px-2 py-1.5 md:flex"
          aria-label="주요 메뉴"
        >
          <ul className="flex items-center gap-1">
            {MENU.map((label) => (
              <li key={label}>
                <a
                  href={`#${label}`}
                  className="font-body text-landing-muted hover:text-landing-text rounded-xl px-3 py-1.5 text-sm font-light transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <motion.a
          href="#cta"
          className="relative z-10 inline-flex items-center gap-2 rounded-2xl bg-teal-400/90 px-5 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-300"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
        >
          시작하기
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </motion.a>
      </div>
    </motion.header>
  )
}
