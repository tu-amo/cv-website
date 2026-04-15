"use client";

export default function GlossaryModal({ activeTerm, onClose }) {
    if (!activeTerm) return null;

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-accent-amber)',
                    borderRadius: '24px',
                    maxWidth: '500px', width: '100%',
                    padding: '40px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    position: 'relative',
                    animation: 'toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '1.5rem', opacity: 0.5 }}
                >✕</button>

                <span style={{ color: 'var(--color-accent-amber)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Glossary Item</span>
                <h2 className="font-heading" style={{ fontSize: '2.5rem', margin: '5px 0 20px', fontStyle: 'italic' }}>
                    {activeTerm.term.split('|')[0].trim()}
                </h2>

                <div style={{ marginBottom: '25px' }}>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-papyrus)', lineHeight: '1.6', marginBottom: '10px' }}>
                        {activeTerm.definition}
                    </p>
                    <p style={{ fontSize: '1rem', fontStyle: 'italic', opacity: 0.8 }}>
                        "{activeTerm.short}"
                    </p>
                </div>

                <div style={{ padding: '20px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-amber)' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: 'var(--color-accent-amber)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Key Aspects:</strong>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{activeTerm.aspects}</p>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--color-accent-amber)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Typical Uses:</strong>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{activeTerm.uses}</p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '30px', width: '100%', padding: '12px',
                        borderRadius: '30px', background: 'var(--color-accent-amber)',
                        color: 'var(--color-bg-deep-olive)', fontWeight: '600'
                    }}
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
