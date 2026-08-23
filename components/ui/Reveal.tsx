'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, CSSProperties, ElementType } from 'react'

/**
 * Fades + slides content in once it enters the viewport.
 * Uses IntersectionObserver instead of CSS animation-timeline:view()
 * so it actually works on Safari/iOS and Firefox, not just Chromium.
 * Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  style,
  as: Tag = 'div',
  delay = 0,
  y = 24,
  duration = 700,
  threshold = 0.15,
  transitionExtra,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: ElementType
  delay?: number
  y?: number
  duration?: number
  threshold?: number
  /** Extra CSS transitions (e.g. 'border-color 0.2s, color 0.2s') to preserve hover transitions on the same element that would otherwise be overwritten by this component's inline transition. */
  transitionExtra?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, visible])

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms${transitionExtra ? `, ${transitionExtra}` : ''}`,
      }}
    >
      {children}
    </Tag>
  )
}
