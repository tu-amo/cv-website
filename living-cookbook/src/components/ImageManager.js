"use client";

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import SecureImage from './SecureImage';

export default function ImageManager({ images = [], onChange, onAiGenerate, aiImagesUsed = 0, isGenerating = false, lastBrief = null }) {
    const [isUploading, setIsUploading] = useState(false);
    const [showBrief, setShowBrief] = useState(false);
    const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'mise'
    const [copyStatus, setCopyStatus] = useState(null); // Feedback for copying
    const supabase = useMemo(() => createClient(), []);

    // Auto-open brief card when a new one arrives
    useEffect(() => {
        if (lastBrief) {
            console.log("ImageManager: New Brief Received!", lastBrief);
            setShowBrief(true);
            // Wait for DOM to update then scroll
            setTimeout(() => {
                const card = document.getElementById('flow-brief-card');
                if (card) {
                    console.log("ImageManager: Scrolling to brief card...");
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    console.warn("ImageManager: Brief card NOT found in DOM!");
                }
            }, 100);
        }
    }, [lastBrief]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploading(true);
        const newImages = [...images];

        for (const file of files) {
            try {
                // 1. Resize/Compress
                const blob = await compressImage(file);
                const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
                
                // 2. Upload to Supabase ('recipe-images' bucket)
                const { data, error } = await supabase.storage
                    .from('recipe-images')
                    .upload(`${fileName}`, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (error) throw error;

                // 3. Store the direct PATH (not Public URL) for security
                newImages.push(data.path);
            } catch (err) {
                console.error("Upload error:", err);
                alert(`Failed to upload ${file.name}. Ensure storage is configured.`);
            }
        }

        onChange(newImages);
        setIsUploading(false);
        e.target.value = "";
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;

                    if (width > height) {
                        if (width > maxDim) { height *= maxDim / width; width = maxDim; }
                    } else {
                        if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
                };
            };
        });
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    const moveImage = (index, direction) => {
        const newImages = [...images];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= newImages.length) return;
        [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
        onChange(newImages);
    };

    return (
        <div className="image-manager-section" style={{ marginBottom: '30px' }}>
            <h2 className="pp-section-heading">Photos &amp; Visuals ({images.length})</h2>

            <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                {images.map((url, idx) => (
                    <div key={idx} className="image-item" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRation: '1/1', background: 'var(--color-surface)', height: '120px' }}>
                        <SecureImage src={url} alt={`Slide ${idx + 1}`} className="ken-burns" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="image-actions" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(0,0,0,0.6)', padding: '4px', gap: '4px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => moveImage(idx, 'up')} disabled={idx === 0} style={{ padding: '2px', background: 'none', border: 'none', color: 'white', opacity: idx === 0 ? 0.3 : 1 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></button>
                            <button type="button" onClick={() => moveImage(idx, 'down')} disabled={idx === images.length - 1} style={{ padding: '2px', background: 'none', border: 'none', color: 'white', opacity: idx === images.length - 1 ? 0.3 : 1 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></button>
                            <button type="button" onClick={() => removeImage(idx)} style={{ padding: '2px', background: 'none', border: 'none', color: '#fc8181' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                        </div>
                    </div>
                ))}

                {/* AI Briefing Trigger */}
                {aiImagesUsed < 2 && (
                    <button 
                        type="button" 
                        onClick={() => { onAiGenerate(); setShowBrief(true); }}
                        disabled={isGenerating}
                        style={{ border: '2px dashed var(--color-primary)', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease', opacity: isGenerating ? 0.5 : 1 }}
                    >
                        {isGenerating ? (
                            <div className="pulse-anim" style={{ fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                <span style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>AI Stylist</span>
                                <span>Thinking... 🧠</span>
                            </div>
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Magic Brief (Flow)</span>
                            </>
                        )}
                    </button>
                )}

                {/* Upload Button */}
                <label style={{ border: '2px dashed var(--color-hairline)', borderRadius: '12px', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                    {isUploading ? (
                        <div className="pulse-anim" style={{ fontSize: '0.7rem' }}>Uploading...</div>
                    ) : (
                        <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 12v9M8 17l4-4 4 4M20 12V8a5 5 0 0 0-10-0M4 12V8a5 5 0 0 1 1.5 -3.5"/></svg>
                            <span style={{ fontSize: '0.7rem' }}>Add Source Photo</span>
                        </>
                    )}
                </label>
            </div>

            {/* THE FLOW BRIEF (EXPERT PROMPTS) */}
            {console.log("ImageManager Render: lastBrief?", !!lastBrief, "showBrief?", showBrief)}
            {lastBrief && showBrief && (
                <div id="flow-brief-card" className="flow-brief-card" style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--color-primary)', borderRadius: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', pb: '12px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                type="button"
                                onClick={() => setActiveTab('mise')}
                                style={{ 
                                    background: activeTab === 'mise' ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === 'mise' ? 'var(--color-bg)' : 'var(--color-primary)',
                                    border: '1px solid var(--color-primary)',
                                    padding: '6px 16px',
                                    borderRadius: '30px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                🍱 Prep (Mise)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setActiveTab('hero')}
                                style={{ 
                                    background: activeTab === 'hero' ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === 'hero' ? 'var(--color-bg)' : 'var(--color-primary)',
                                    border: '1px solid var(--color-primary)',
                                    padding: '6px 16px',
                                    borderRadius: '30px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                🍲 Finished (Hero)
                            </button>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => { 
                                const text = activeTab === 'mise' ? lastBrief.mise : lastBrief.hero;
                                navigator.clipboard.writeText(text); 
                                alert(`Copied ${activeTab === 'mise' ? 'Prep' : 'Hero'} Brief!`);
                            }}
                            style={{ background: 'var(--color-surface)', color: 'var(--color-on-surface)', border: '1px solid var(--color-hairline)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Copy Link 📋
                        </button>
                    </div>

                    <div style={{ minHeight: '80px' }}>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-on-surface)', lineHeight: '1.7', fontStyle: 'italic', margin: 0, opacity: 0.9 }}>
                            "{activeTab === 'mise' ? lastBrief.mise : lastBrief.hero}"
                        </p>
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '15px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}><path d="m13 2-2 2.5h3L12 7l3-3.5h-3L14 2zM5.5 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM18.5 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 19h18M5 19V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13"/></svg>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', opacity: 0.8, lineHeight: '1.4' }}>
                            <strong>Chef's Tip:</strong> Use one of your source photos as a "Visual Anchor" in <strong>Google Flow</strong> or <strong>Imagen</strong> when pasting this brief to maintain composition while applying the cinematic soul.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
