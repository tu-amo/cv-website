/**
 * icons.js — Shared inline SVG icon library
 *
 * Pattern: 24×24 viewBox, stroke="currentColor", fill="none", aria-hidden
 * Size is controlled by width/height props (default 18px to match nav).
 * Usage:  import { Icon } from '@/components/icons';
 *         <span className="pp-drawer__item-icon">{Icon.cart}</span>
 *         <Icon.trash size={16} />  ← functional form for custom sizing
 *
 * All paths sourced from Lucide (MIT) — redrawn as static JSX, no dep needed.
 */

// ─── Helper: wrap a path in a sized SVG ───────────────────────────────────
const svg = (paths, size = 18, extra = {}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...extra}
    >
        {paths}
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Icon object — static 18px versions (drop-in for emoji in labels / buttons)
// ─────────────────────────────────────────────────────────────────────────────
export const Icon = {

    // ── Navigation (already in PretzelNav) ───────────────────────────────────
    menu: svg(<>
        <line x1="3"  y1="6"  x2="21" y2="6"  />
        <line x1="3"  y1="12" x2="21" y2="12" />
        <line x1="3"  y1="18" x2="21" y2="18" />
    </>),

    close: svg(<>
        <line x1="18" y1="6"  x2="6"  y2="18" />
        <line x1="6"  y1="6"  x2="18" y2="18" />
    </>, 20),

    globe: svg(<>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>),

    person: svg(<>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </>),

    book: svg(<>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>),

    cart: svg(<>
        <circle cx="9"  cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>),

    house: svg(<>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </>),

    building: svg(<>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2" />
        <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </>),

    settings: svg(<>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>),

    monitor: svg(<>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8"  y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </>),

    logout: svg(<>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </>),

    // ── New icons for page-level emoji replacement ────────────────────────────

    trash: svg(<>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>),

    clipboard: svg(<>
        <rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>),

    file: svg(<>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </>),

    store: svg(<>
        <path d="M3 9l1-4h16l1 4" />
        <path d="M3 9v11a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9" />
        <path d="M3 9h18" />
    </>),

    chef: svg(<>
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line x1="6"  y1="17" x2="18" y2="17" />
        <line x1="6"  y1="13" x2="18" y2="13" />
    </>),

    warn: svg(<>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9"  x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </>),

    plus: svg(<>
        <line x1="12" y1="5"  x2="12" y2="19" />
        <line x1="5"  y1="12" x2="19" y2="12" />
    </>),

    pencil: svg(<>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>),

    search: svg(<>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>),

    flag: svg(<>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
    </>),

    info: svg(<>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8"  x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </>),

    check: svg(<>
        <polyline points="20 6 9 17 4 12" />
    </>),

    share: svg(<>
        <circle cx="18" cy="5"  r="3" />
        <circle cx="6"  cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
    </>),

    printer: svg(<>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
    </>),

    refresh: svg(<>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </>),

    arrowRight: svg(<>
        <line x1="5"  y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </>),

    plan: svg(<>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
    </>),

    scan: svg(<>
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
    </>),

    whatsapp: svg(<>
        {/* Simple speech-bubble as WhatsApp stand-in */}
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </>),

    switch: svg(<>
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>),

    x: svg(<>
        <line x1="18" y1="6"  x2="6"  y2="18" />
        <line x1="6"  y1="6"  x2="18" y2="18" />
    </>, 16),

    users: svg(<>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>),

    crown: svg(<>
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <path d="M5 20h14" />
    </>),
};

// ─────────────────────────────────────────────────────────────────────────────
// Sized variant: <Icon.trash size={20} />
// Lets pages request custom sizes without re-importing paths.
// ─────────────────────────────────────────────────────────────────────────────
export function makeIcon(paths) {
    return function IconComponent({ size = 18, className, style } = {}) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={className}
                style={style}
            >
                {paths}
            </svg>
        );
    };
}
