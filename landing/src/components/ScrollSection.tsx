import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type ScrollSectionProps = {
  id: string
  title: string
  children: ReactNode
}

export function ScrollSection({ id, title, children }: ScrollSectionProps) {
  return (
    <motion.section
      id={id}
      className="mx-auto max-w-4xl px-6 py-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px', amount: 0.25 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="font-heading italic text-landing-text mb-6 text-4xl tracking-tight md:text-5xl">
        {title}
      </h2>
      <div className="font-body text-landing-muted text-sm font-light">{children}</div>
    </motion.section>
  )
}
