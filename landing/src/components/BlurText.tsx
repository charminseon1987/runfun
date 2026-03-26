import { motion } from 'motion/react'

type BlurTextProps = {
  text: string
  className?: string
}

export function BlurText({ text, className = '' }: BlurTextProps) {
  const words = text.trim().split(/\s+/)

  return (
    <span
      className={`inline-flex max-w-5xl flex-wrap justify-center gap-x-[0.28em] gap-y-2 ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="font-heading italic text-landing-text tracking-tight leading-[0.9] inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
          initial={{ filter: 'blur(10px)', y: 20, opacity: 0 }}
          animate={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
          transition={{
            duration: 0.65,
            delay: i * 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}
