'use client'

import { motion, type Variants } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const slideInVariants = (direction: 'left' | 'right'): Variants => ({
  hidden: { opacity: 0, x: direction === 'left' ? -40 : 40 },
  visible: { opacity: 1, x: 0 },
})

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

interface MotionSectionProps extends HTMLMotionProps<'div'> {
  delay?: number
}

export function FadeUp({ delay = 0, children, ...props }: MotionSectionProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({ delay = 0, children, ...props }: MotionSectionProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({
  direction = 'left',
  delay = 0,
  children,
  ...props
}: MotionSectionProps & { direction?: 'left' | 'right' }) {
  return (
    <motion.div
      variants={slideInVariants(direction)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ delay = 0, children, ...props }: MotionSectionProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
