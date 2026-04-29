/**
 * nav.js - Site-wide Navigation & Background Component (B8)
 * Single source of truth for the site's structural shell.
 */

const NAV_CONFIG = {
    links: [
        { href: '/', label: 'Home' },
        { href: '/blog.html', label: 'Writing' },
        { href: '/booking.html', label: 'Booking' },
        { href: '/cv', label: 'CV' },
        { href: '/concern-to-measure/', label: 'Tools' }
    ]
};

/**
 * Step 1: Analyze Navigation State
 */
function analyzeState() {
    const path = window.location.pathname;
    const normalizedPath = path === '/' ? '/index.html' : path;
    
    return {
        path: normalizedPath,
        isHome: normalizedPath === '/index.html' || normalizedPath === '/',
        isCV: normalizedPath.includes('/cv')
    };
}

/**
 * Step 2: Generate Component HTML
 */
function generateHtml(state) {
    // 1. Skip Link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';

    // 2. Background Globes
    const globes = document.createElement('div');
    globes.className = 'background-globes';
    globes.setAttribute('aria-hidden', 'true');
    globes.innerHTML = `
        <div class="globe globe-1"></div>
        <div class="globe globe-2"></div>
        <div class="globe globe-3"></div>
    `;

    // 3. Navigation
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site navigation');

    const brand = `
        <a href="/" class="site-nav__brand" aria-label="Jane Petra Scott — Home">
            <span class="site-nav__brand-name">Jane Petra Scott</span>
            <span class="site-nav__brand-sub">SAP Architect & Digital Transformation</span>
        </a>
    `;

    const linksHtml = NAV_CONFIG.links.map(link => {
        const isActive = isPathActive(state.path, link.href);
        return `<a href="${link.href}" class="site-nav__link ${isActive ? 'site-nav__link--active' : ''}">${link.label}</a>`;
    }).join('');

    // Page-specific action (Save PDF for CV)
    let actionHtml = '';
    if (state.isCV) {
        actionHtml = `
            <a href="/assets/downloads/Jane_Scott_CV_Short.pdf" class="site-nav__action" aria-label="Download Executive Summary PDF">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 10v3h10v-3M5 7l3 3 3-3M8 2v8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Save PDF
            </a>
        `;
    }

    nav.innerHTML = `
        ${brand}
        <div class="site-nav__links">
            ${linksHtml}
            ${actionHtml}
        </div>
    `;

    return { skipLink, globes, nav };
}

/**
 * Utility: Path matching logic
 */
function isPathActive(currentPath, targetHref) {
    if (targetHref === '/') {
        return currentPath === '/' || currentPath === '/index.html';
    }
    
    // Normalize both for comparison
    const normCurrent = currentPath.replace(/\.html$/, '').replace(/\/$/, '');
    const normTarget = targetHref.replace(/\.html$/, '').replace(/\/$/, '');
    
    return normCurrent === normTarget || normCurrent.startsWith(normTarget + '/');
}

/**
 * Step 3: Execute Injection
 */
function executeInjection() {
    // Prevent double injection
    if (document.querySelector('.site-nav')) return;

    const state = analyzeState();
    const { skipLink, globes, nav } = generateHtml(state);

    // Prepend in order: Nav, then Globes, then Skip Link
    document.body.prepend(nav);
    document.body.prepend(globes);
    document.body.prepend(skipLink);
}

// Start Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executeInjection);
} else {
    executeInjection();
}
