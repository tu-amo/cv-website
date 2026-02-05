import Analytics from './analytics.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('CV Loaded');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Only apply animations if IntersectionObserver is supported
    // This ensures content is visible for Lighthouse and users without JS
    if ('IntersectionObserver' in window) {
        // Select elements to animate
        const sections = document.querySelectorAll('.section');
        const items = document.querySelectorAll('.timeline-item');
        const skills = document.querySelectorAll('.skill-tag');

        [...sections, ...items].forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });

        // Staggered animation for skills
        skills.forEach((skill, index) => {
            skill.style.opacity = '0';
            skill.style.transform = 'translateY(10px)';
            skill.style.transition = `opacity 0.4s ease-out ${index * 0.05}s, transform 0.4s ease-out ${index * 0.05}s, background 0.3s, color 0.3s, box-shadow 0.3s`;

            // We can just observe the parent section for skills trigger
            observer.observe(skill);
        });
    }
});

// --- ARCHITECTURE SLIDER LOGIC ---
const sliderContainer = document.querySelector('.slider-container');
const sliderHandle = document.querySelector('.slider-handle');
const sliderCircle = document.querySelector('.slider-circle');
const modernImage = document.querySelector('.img-modern');
const sliderInput = document.getElementById('architecture-slider');

if (sliderContainer && sliderHandle && modernImage) {
    let hasStartedTracking = false;
    let hasCompletedTracking = false;
    let isDragging = false;

    const updateSlider = (percent) => {
        percent = Math.min(Math.max(percent, 0), 100);

        // Tracking: Start
        if (!hasStartedTracking && percent !== 50) {
            Analytics.trackArchitectureSlider('start');
            hasStartedTracking = true;
        }

        // Tracking: Completion (Threshold 15% - showing most of modern)
        // Since dragging to the left reveals more modern, if percent < 15, they've seen most of it.
        if (!hasCompletedTracking && percent < 15) {
            Analytics.trackArchitectureSlider('complete');
            hasCompletedTracking = true;
        }

        sliderHandle.style.left = `${percent}%`;
        if (sliderCircle) sliderCircle.style.left = `${percent}%`;
        modernImage.style.clipPath = `polygon(${percent}% 0, 100% 0, 100% 100%, ${percent}% 100%)`;

        // Sync hidden input for screen readers
        if (sliderInput && sliderInput.value != percent) {
            sliderInput.value = percent;
        }
    };

    const getPercentFromX = (x) => {
        const rect = sliderContainer.getBoundingClientRect();
        return ((x - rect.left) / rect.width) * 100;
    };

    // Interaction Handlers
    const startDrag = () => isDragging = true;
    const stopDrag = () => isDragging = false;
    const doDrag = (x) => { if (isDragging) updateSlider(getPercentFromX(x)); };

    sliderContainer.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', (e) => doDrag(e.clientX));

    sliderContainer.addEventListener('touchstart', startDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', (e) => doDrag(e.touches[0].clientX));

    sliderContainer.addEventListener('click', (e) => {
        if (!isDragging) updateSlider(getPercentFromX(e.clientX));
    });

    // Keyboard / Screen Reader Support
    if (sliderInput) {
        sliderInput.addEventListener('input', (e) => {
            updateSlider(parseFloat(e.target.value));
        });
    }

    // Set initial position
    updateSlider(50);
}

