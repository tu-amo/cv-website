// Add some subtle interaction or animation enhancements
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
});

// --- ARCHITECTURE SLIDER LOGIC ---
const sliderContainer = document.querySelector('.slider-container');
const sliderHandle = document.querySelector('.slider-handle');
const sliderCircle = document.querySelector('.slider-circle');
const modernImage = document.querySelector('.img-modern');

if (sliderContainer && sliderHandle && modernImage) {
    let isDragging = false;

    const updateSlider = (x) => {
        const rect = sliderContainer.getBoundingClientRect();
        let percent = ((x - rect.left) / rect.width) * 100;
        percent = Math.min(Math.max(percent, 0), 100);

        sliderHandle.style.left = `${percent}%`;
        // Keep circle centered on handle
        if (sliderCircle) sliderCircle.style.left = `${percent}%`;

        // Wipe Effect: 
        // 0%  = Handle at Left  = Modern Image fully REVEALED (clip 0 -> 100) ??
        // PROPOSAL:
        // Left Side = LEGACY
        // Right Side = MODERN
        // As I drag handle to RIGHT, I reveal more Legacy? Or Reveal more Modern?
        // "Waping away legacy" = Drag handle from Left to Right reveals Modern?

        // Let's implement: Left Side is Legacy. Right Side is Modern.
        // Clip Path polygon(X 0, 100 0, 100 100, X 100) -> Keeps right side visible
        modernImage.style.clipPath = `polygon(${percent}% 0, 100% 0, 100% 100%, ${percent}% 100%)`;
    };

    const startDrag = () => isDragging = true;
    const stopDrag = () => isDragging = false;
    const doDrag = (x) => { if (isDragging) updateSlider(x); };

    sliderContainer.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', (e) => doDrag(e.clientX));

    sliderContainer.addEventListener('touchstart', startDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', (e) => doDrag(e.touches[0].clientX));

    sliderContainer.addEventListener('click', (e) => updateSlider(e.clientX));
}

