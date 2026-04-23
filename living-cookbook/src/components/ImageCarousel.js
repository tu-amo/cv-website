"use client";

import { useState, useEffect, useRef } from 'react';
import SecureImage from './SecureImage';

export default function ImageCarousel({ images = [], title = "Recipe", type = "card" }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const touchStart = useRef(null);

    const fallbackImage = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670";

    // Normalize images: handle single legacy image string or empty array
    const imageList = Array.isArray(images) && images.length > 0 
        ? images 
        : (typeof images === 'string' && images ? [images] : []);

    const total = imageList.length;

    // IntersectionObserver for mobile auto-play
    useEffect(() => {
        if (!containerRef.current || type !== 'card') return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.6 }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [type]);

    // Auto-advance logic
    useEffect(() => {
        if (total <= 1) return;
        const shouldAdvance = type === 'hero' || (isHovered && !isVisible) || isVisible;
        if (!shouldAdvance) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % total);
        }, type === 'hero' ? 5000 : 2500);

        return () => clearInterval(interval);
    }, [total, isHovered, isVisible, type]);

    const handleNext = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setCurrentIndex((prev) => (prev + 1) % total);
    };

    const handlePrev = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setCurrentIndex((prev) => (prev - 1 + total) % total);
    };

    const onTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
    const onTouchMove = (e) => {
        if (!touchStart.current) return;
        const touchEnd = e.targetTouches[0].clientX;
        const diff = touchStart.current - touchEnd;
        if (Math.abs(diff) > 50) {
            e.preventDefault();
            if (diff > 0) handleNext();
            else handlePrev();
            touchStart.current = null;
        }
    };

    // --- CASE 1: NO IMAGES ---
    if (total === 0) {
        return (
            <div className={`carousel-container ${type}`}>
                <SecureImage src={fallbackImage} alt="Placeholder" className="ken-burns" style={{ opacity: 0.15 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 2, width: '100%', padding: '20px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-amber)" strokeWidth="1" style={{ opacity: 0.3, margin: '0 auto' }}>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><polyline points="16 5 21 5 21 10" /><line x1="9" y1="15" x2="21" y2="3" />
                    </svg>
                    <p className="font-heading" style={{ marginTop: '10px', color: 'var(--color-text-papyrus)', opacity: 0.8 }}>{title}</p>
                </div>
            </div>
        );
    }

    // --- CASE 2: SINGLE IMAGE ---
    if (total === 1) {
        return (
            <div className={`carousel-container ${type}`}>
                <SecureImage 
                    src={imageList[0] || fallbackImage} 
                    alt={title} 
                    className={type === 'hero' ? 'ken-burns' : ''} 
                    style={{ objectFit: 'contain', width: '100%', height: '100%', backgroundColor: 'var(--color-bg-deep-olive)' }}
                    loading="eager"
                    fetchpriority={type === 'hero' ? "high" : undefined}
                    onError={(e) => { e.target.src = fallbackImage; }}
                />
                {type === 'hero' && <div className="hero-overlay" />}
            </div>
        );
    }

    // --- CASE 3: MULTI-IMAGE CAROUSEL ---
    return (
        <div 
            ref={containerRef}
            className={`carousel-container ${type}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
        >
            {imageList.map((img, idx) => (
                <div 
                    key={idx} 
                    className={`carousel-slide ${idx === currentIndex ? 'active' : ''}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: idx === currentIndex ? 1 : 0, transition: 'opacity 0.8s ease' }}
                >
                    <SecureImage 
                        src={img || fallbackImage} 
                        alt={`${title} - image ${idx + 1}`} 
                        className={type === 'hero' ? 'ken-burns' : ''}
                        style={{ objectFit: type === 'hero' ? 'cover' : 'contain', width: '100%', height: '100%', backgroundColor: 'var(--color-bg-deep-olive)' }}
                        loading={idx === 0 ? "eager" : "lazy"}
                        fetchpriority={idx === 0 && type === 'hero' ? "high" : undefined}
                        onError={(e) => { if (e?.target && e.target.src !== fallbackImage) e.target.src = fallbackImage; }}
                    />
                </div>
            ))}

            {type === 'hero' && <div className="hero-overlay" />}

            <div className="carousel-controls">
                <button className="carousel-nav-btn prev" onClick={handlePrev} aria-label="Previous image">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button className="carousel-nav-btn next" onClick={handleNext} aria-label="Next image">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>

            <div className="carousel-dots">
                {imageList.map((_, idx) => (
                    <button
                        key={idx}
                        className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentIndex(idx);
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
