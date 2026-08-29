import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/types'

type ProjectTileProps = {
  project: Project
  index: number
  featured?: boolean
}

function ProjectTile({ project, index, featured = false }: ProjectTileProps) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <Link
      href={`/work/${project.slug}`}
      className={`fpg-card ${featured ? 'fpg-card-featured' : ''}`}
      aria-label={`View ${project.title} case study`}
    >
      <div className="fpg-media">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={`${project.title} — ${project.category} design by Nicopixel`}
            fill
            sizes={featured ? '(max-width: 767px) 100vw, 50vw' : '(max-width: 767px) 50vw, 25vw'}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="fpg-placeholder" aria-hidden="true">
            <span>{project.category}</span>
          </div>
        )}
      </div>
      <span className="fpg-arrow" aria-hidden="true">↗</span>
      <span className="fpg-meta">
        <span className="fpg-project-title">{number} / {project.title}</span>
        <span className="fpg-project-category">{project.category}</span>
      </span>
    </Link>
  )
}

/**
 * Square-first featured work gallery.
 *
 * Project cover images are uploaded as squares, so this layout keeps every
 * image at its natural 1:1 presentation instead of cropping it into a card
 * or concealing it behind an accordion. Each project is one complete link to
 * its case study, including its image and label.
 */
export function FeaturedProjectsGallery({ projects }: { projects: Project[] }) {
  const [featuredProject, ...supportingProjects] = projects

  if (!featuredProject) return null

  return (
    <div className={`fpg-layout ${supportingProjects.length === 0 ? 'fpg-layout-solo' : ''}`}>
      <ProjectTile project={featuredProject} index={0} featured />

      {supportingProjects.length > 0 && (
        <div className="fpg-supporting-grid">
          {supportingProjects.map((project, index) => (
            <ProjectTile key={project.id} project={project} index={index + 1} />
          ))}
        </div>
      )}

      <style>{`
        .fpg-layout {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .fpg-layout-solo { grid-template-columns: minmax(0, 1fr); }
        .fpg-supporting-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-content: start;
          gap: 16px;
        }
        .fpg-card {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-secondary);
          color: white;
          text-decoration: none;
          isolation: isolate;
        }
        .fpg-media { position: absolute; inset: 0; }
        .fpg-media img { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .fpg-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--bg-secondary);
          color: var(--fg-subtle);
          font-family: var(--font-heading);
          font-size: clamp(20px, 2.2vw, 34px);
          font-style: italic;
          text-transform: capitalize;
        }
        .fpg-arrow {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 1;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          background: var(--accent);
          color: white;
          font-size: 22px;
          line-height: 1;
          transition: background 0.2s ease, transform 0.25s ease;
        }
        .fpg-meta {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 42px;
          padding: 10px 14px;
          background: rgba(10, 10, 10, 0.94);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
        }
        .fpg-project-title {
          min-width: 0;
          overflow: hidden;
          color: #FAFAF9;
          font-family: var(--font-heading);
          font-size: clamp(15px, 1.35vw, 20px);
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fpg-project-category {
          flex-shrink: 0;
          color: rgba(250, 250, 249, 0.72);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .fpg-card-featured .fpg-meta { min-height: 54px; padding: 13px 16px; }
        .fpg-card-featured .fpg-project-title { font-size: clamp(18px, 1.7vw, 26px); }
        @media (hover: hover) {
          .fpg-card:hover .fpg-media img { transform: scale(1.035); }
          .fpg-card:hover .fpg-arrow { background: var(--accent-hover); transform: translate(-3px, 3px); }
        }
        @media (max-width: 767px) {
          .fpg-layout { grid-template-columns: minmax(0, 1fr); gap: 10px; }
          .fpg-supporting-grid { gap: 10px; }
          .fpg-arrow { width: 34px; height: 34px; font-size: 18px; }
          .fpg-meta { min-height: 34px; padding: 8px 9px; gap: 8px; }
          .fpg-project-title { font-size: 13px; }
          .fpg-project-category { display: none; }
          .fpg-card-featured .fpg-meta { min-height: 44px; padding: 10px 12px; }
          .fpg-card-featured .fpg-project-title { font-size: 18px; }
        }
      `}</style>
    </div>
  )
}
