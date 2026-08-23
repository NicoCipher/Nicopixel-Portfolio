'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { trackEvent } from '@/lib/analytics'

const links = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/services', label: 'Services' },
  { href: '/blog', label: 'Insights' },
  { href: '/about', label: 'About' },
]

export function Navbar({ settings }: { settings?: Record<string, string | null> }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const firstDrawerLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    const onScroll = () => {
      if (rafId !== null) return // already have an update queued for this frame
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 40)
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        setProgress(docHeight > 0 ? Math.min(y / docHeight, 1) : 0)
        rafId = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Close menu on route change
  useEffect(() => { const t = setTimeout(() => setMenuOpen(false), 0); return () => clearTimeout(t) }, [pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Modal accessibility for the mobile drawer: without this, keyboard users
  // can Tab straight through an "open" drawer into the page content sitting
  // invisibly behind it — a real WCAG 2.4.3 focus-order failure, not just
  // a nicety. inert (broadly supported in evergreen browsers) removes main/
  // footer from the tab order and AT tree entirely while the drawer is open.
  useEffect(() => {
    const main = document.querySelector('main')
    const footer = document.querySelector('footer')
    if (menuOpen) {
      main?.setAttribute('inert', '')
      footer?.setAttribute('inert', '')
      firstDrawerLinkRef.current?.focus()
    } else {
      main?.removeAttribute('inert')
      footer?.removeAttribute('inert')
    }
    return () => {
      main?.removeAttribute('inert')
      footer?.removeAttribute('inert')
    }
  }, [menuOpen])

  // Escape to close + return focus to the trigger, and a Tab-trap so focus
  // can't leave the drawer while it's open (standard dialog pattern).
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        burgerRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 8px 24px rgba(0, 0, 0, 0.04)' : 'none',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        {/* Reading progress bar — thin crimson line at bottom of navbar.
            transform:scaleX instead of width: width is layout-triggering
            and not GPU-accelerated, which combined with the previously
            unthrottled scroll handler caused visible stutter on desktop
            (mouse-wheel scroll fires far more scroll events than mobile
            touch scrolling does). No CSS transition here deliberately —
            the RAF-throttled updates above already land at the display's
            refresh rate, so an added transition would only lag the bar
            behind the actual scroll position instead of helping. */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2, width: '100%', background: 'var(--accent)',
          transform: `scaleX(${progress})`, transformOrigin: 'left',
          pointerEvents: 'none', zIndex: 200,
          opacity: progress > 0.02 ? 1 : 0,
        }} />
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 101 }}>
          {settings?.logo_url
            ? <div style={{ position: 'relative', height: 32, width: 120 }}>
                <Image src={settings.logo_url} alt="Nicopixel" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
              </div>
            : <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: 'var(--fg)', letterSpacing: '0.02em' }}>Nicopixel</span>
          }
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`nav-link ${pathname === l.href ? 'nav-link-active' : ''}`}
            >{l.label}</Link>
          ))}
          <Link href="/contact" className="nav-cta" onClick={() => trackEvent('nav_cta_clicked', pathname)}>Start a Project</Link>
          <ThemeToggle />
        </div>

        {/* Mobile nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }} className="nav-mobile">
          <ThemeToggle />
          <button
            ref={burgerRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`burger-line burger-line-1 ${menuOpen ? 'burger-open' : ''}`} />
            <span className={`burger-line burger-line-2 ${menuOpen ? 'burger-open' : ''}`} />
            <span className={`burger-line burger-line-3 ${menuOpen ? 'burger-open' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`nav-backdrop ${menuOpen ? 'nav-backdrop-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile menu drawer */}
      <div
        ref={drawerRef}
        className={`nav-drawer ${menuOpen ? 'nav-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="nav-drawer-links">
          {links.map((l, i) => (
            <Link
              key={l.href}
              ref={i === 0 ? firstDrawerLinkRef : undefined}
              href={l.href}
              className="nav-drawer-link"
              style={{
                color: pathname === l.href ? 'var(--accent)' : 'var(--fg)',
                transitionDelay: menuOpen ? `${i * 0.04 + 0.1}s` : '0s',
              }}
            >
              <span className="nav-drawer-link-num">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </Link>

          ))}
        </div>

        <div className="nav-drawer-footer" style={{ transitionDelay: menuOpen ? `${links.length * 0.04 + 0.15}s` : '0s' }}>
          <Link href="/contact" className="nav-drawer-cta" onClick={() => trackEvent('nav_cta_clicked', pathname)}>Start a Project →</Link>
          <div className="nav-drawer-divider" />
          <div className="nav-drawer-socials">
            {[
              { key: 'behance', label: 'Behance' },
              { key: 'instagram', label: 'Instagram' },
              { key: 'tiktok', label: 'TikTok' },
              { key: 'linkedin', label: 'LinkedIn' },
              { key: 'twitter', label: 'Twitter / X' },
            ]
              .filter(s => {
                const url = settings?.[s.key]
                const enabled = settings?.[`${s.key}_enabled`]
                return !!url && enabled !== 'false'
              })
              .map(s => (
                <a key={s.key} href={settings?.[s.key] as string} target="_blank" rel="noopener noreferrer" className="nav-drawer-social">{s.label}</a>
              ))}
          </div>
          <span className="nav-drawer-location">Lagos, Nigeria · Available for projects</span>
        </div>
      </div>

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-mobile { display: none !important; }

        .nav-link {
          position: relative;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--fg-muted); text-decoration: none;
          padding-bottom: 3px; white-space: nowrap;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px;
          background: var(--accent);
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link:hover { color: var(--fg); }
        .nav-link:hover::after { width: 100%; }
        .nav-link-active { color: var(--fg); }
        .nav-link-active::after { width: 100%; }

        .nav-cta {
          display: inline-flex; align-items: center;
          padding: 9px 20px;
          background: var(--accent); color: white;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; white-space: nowrap;
          transition: background 0.2s, transform 0.2s;
        }
        .nav-cta:hover { background: var(--accent-hover); transform: translateY(-1px); }

        .nav-drawer-cta {
          display: flex; align-items: center; justify-content: center;
          padding: 16px 24px;
          background: var(--accent); color: white;
          font-family: var(--font-body); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s;
        }
        .nav-drawer-cta:hover { background: var(--accent-hover); }

        .nav-burger {
          position: relative; z-index: 101;
          width: 44px; height: 44px;
          margin: 0 -8px 0 -6px;
          background: none; border: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 5px; padding: 0;
        }
        .burger-line {
          display: block; width: 18px; height: 1.5px;
          background: var(--fg);
          border-radius: 1px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .burger-line-1.burger-open { transform: translateY(6.5px) rotate(45deg); }
        .burger-line-2.burger-open { opacity: 0; }
        .burger-line-3.burger-open { transform: translateY(-6.5px) rotate(-45deg); }

        .nav-backdrop {
          position: fixed; inset: 0; z-index: 98;
          background: rgba(0,0,0,0.4);
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .nav-backdrop-open { opacity: 1; pointer-events: auto; }

        .nav-drawer {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 99;
          width: min(100%, 420px);
          background: var(--bg);
          border-left: 1px solid var(--border);
          padding: 100px 40px 40px;
          display: flex; flex-direction: column; justify-content: space-between;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow-y: auto;
        }
        .nav-drawer-open { transform: translateX(0); }

        .nav-drawer-links { display: flex; flex-direction: column; gap: 2px; }
        .nav-drawer-link {
          display: flex; align-items: baseline; gap: 16px;
          padding: 16px 0;
          font-family: var(--font-heading);
          font-size: clamp(24px, 6vw, 32px);
          font-weight: 400;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          opacity: 0; transform: translateX(16px);
          transition: opacity 0.4s ease, transform 0.4s ease, color 0.2s;
        }
        .nav-drawer-open .nav-drawer-link { opacity: 1; transform: translateX(0); }
        .nav-drawer-link-num {
          font-size: 11px; font-family: var(--font-body);
          color: var(--fg-subtle); letter-spacing: 0.1em;
          flex-shrink: 0;
        }

        .nav-drawer-footer {
          display: flex; flex-direction: column; gap: 20px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .nav-drawer-open .nav-drawer-footer { opacity: 1; transform: translateY(0); }
        .nav-drawer-divider { height: 1px; background: var(--border); }
        .nav-drawer-socials { display: flex; gap: 20px; flex-wrap: wrap; }
        .nav-drawer-social {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--fg-muted); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-drawer-social:hover { color: var(--accent-text); }
        .nav-drawer-location {
          font-size: 11px; color: var(--fg-subtle); letter-spacing: 0.02em;
        }

        @media(max-width: 1100px) {
          .nav-desktop { gap: 18px !important; }
          .nav-cta { padding: 8px 14px !important; }
        }
        @media(max-width: 950px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          nav { padding: 0 20px !important; }
        }
        @media(max-width: 480px) {
          .nav-drawer { padding: 88px 28px 32px; width: 100%; border-left: none; }
          .nav-drawer-link { font-size: 26px; padding: 14px 0; }
        }
      `}</style>
    </>
  )
}
