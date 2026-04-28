/**
 * head.js - Site-wide Head Manager (B9)
 * Handles font loading, navigation styling, and shared meta tags.
 * Modular source of truth for site-wide metadata.
 */

const HEAD_CONFIG = {
    fonts: [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap'
    ],
    stylesheets: [
        '/src/nav.css'
    ],
    meta: [
        { name: 'author', content: 'Jane Petra Scott' },
        { name: 'theme-color', content: '#0d1a16' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
    ],
    preconnect: [
        { href: 'https://fonts.googleapis.com' },
        { href: 'https://fonts.gstatic.com', crossorigin: true }
    ]
};

/**
 * Execute Head Injection
 */
function executeHeadInjection() {
    const head = document.head;

    // 1. Preconnect to external origins
    HEAD_CONFIG.preconnect.forEach(site => {
        if (document.querySelector(`link[rel="preconnect"][href="${site.href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = site.href;
        if (site.crossorigin) link.setAttribute('crossorigin', '');
        head.appendChild(link);
    });

    // 2. Load Web Fonts
    HEAD_CONFIG.fonts.forEach(url => {
        if (document.querySelector(`link[href="${url}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        head.appendChild(link);
    });

    // 3. Load Shared Component Styles
    HEAD_CONFIG.stylesheets.forEach(url => {
        if (document.querySelector(`link[href="${url}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        head.appendChild(link);
    });

    // 4. Shared Meta Tags
    HEAD_CONFIG.meta.forEach(m => {
        if (document.querySelector(`meta[name="${m.name}"]`)) return;
        const meta = document.createElement('meta');
        meta.name = m.name;
        meta.content = m.content;
        head.appendChild(meta);
    });
}

// Initialise immediately to reduce FOUC/FOIT
executeHeadInjection();
