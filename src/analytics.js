/**
 * Analytics.js
 * Lightweight, privacy-focused tracking helper for Cloudflare Web Analytics / Custom Beacons.
 */

const Analytics = {
    /**
     * Track a custom event
     * @param {string} eventName - The name of the event (e.g., 'cv_download')
     * @param {Object} properties - Additional context (e.g., { type: 'PDF' })
     */
    track: function (eventName, properties = {}) {
        console.log(`[Analytics] Event: ${eventName}`, properties);

        // If Cloudflare Web Analytics custom events are supported via beacon
        // We'll use the standard beacon approach for custom events
        if (window.navigator.sendBeacon) {
            // Placeholder for actual analytics endpoint if needed
            // For now, we log to console to verify logic before adding a provider-specific snippet
        }

        // If Cloudflare JS snippet is present, we could push to a data layer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: eventName,
            ...properties,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Track CV Download
     * @param {string} format - 'Word' or 'PDF'
     */
    trackDownload: function (format) {
        this.track('cv_download', {
            format: format,
            page: window.location.pathname
        });
    },

    /**
     * Track Architecture Slider Interaction
     * @param {string} action - 'start' or 'complete'
     */
    trackArchitectureSlider: function (action) {
        this.track('architecture_demo', {
            action: action,
            page: 'architecture_demo'
        });
    }
};

export default Analytics;
