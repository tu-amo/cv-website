/**
 * PageHeader — standard page title block
 * ─────────────────────────────────────────────────────────────────────────────
 * No 'use client' — works in both server and client components.
 *
 * Usage:
 *   import { PageHeader } from '@/components/ui';
 *
 *   // Simple
 *   <PageHeader title="System Info" />
 *
 *   // With overline + subtitle
 *   <PageHeader
 *     overline="Account"
 *     title="My Profile"
 *     subtitle="Manage your display name and account settings."
 *   />
 *
 *   // With action buttons (right side)
 *   <PageHeader
 *     title="Market List"
 *     actions={<><button>Copy</button><button>Share</button></>}
 *   />
 *
 * Props:
 *   overline  — small uppercase label above the title (optional)
 *   title     — page title; rendered as <h1> (required)
 *   subtitle  — descriptive text below the title; accepts string or JSX (optional)
 *   actions   — right-side content e.g. action buttons (optional)
 */

import styles from './PageHeader.module.css';

export function PageHeader({ overline, title, subtitle, actions }) {
  return (
    <header className={styles.header}>
      <div className={actions ? styles.headerRow : undefined}>
        <div>
          {overline && <span className={styles.overline}>{overline}</span>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
