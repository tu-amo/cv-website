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
