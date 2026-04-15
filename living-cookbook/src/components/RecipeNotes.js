"use client";

export default function RecipeNotes({ notes, isEditable, onAddNote, onDeleteNote, newNote, setNewNote, isSavingNote }) {
    return (
        <section style={{ marginTop: '60px' }}>
            <h2 className="pp-section-heading">Kitchen Notes</h2>

            {isEditable && (
                <div style={{ marginBottom: '40px', background: 'rgba(235, 220, 178, 0.02)', padding: '25px', borderRadius: '16px', border: '1px dashed var(--color-hairline)' }}>
                    <textarea
                        placeholder="What did you change? (e.g. used double garlic, baked 5 mins longer)"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-on-surface)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '1rem',
                            resize: 'vertical',
                            minHeight: '80px',
                            outline: 'none',
                            marginBottom: '10px'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onAddNote}
                            disabled={isSavingNote || !newNote.trim()}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'var(--color-bg)',
                                padding: '8px 24px',
                                borderRadius: '25px',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'transform 0.2s',
                                cursor: (isSavingNote || !newNote.trim()) ? 'default' : 'pointer',
                                opacity: (isSavingNote || !newNote.trim()) ? 0.5 : 1
                            }}
                        >
                            {isSavingNote ? "Adding..." : "Add Note"}
                        </button>
                    </div>
                </div>
            )}

            <div className="notes-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {notes.length === 0 ? (
                    <p style={{ color: 'var(--color-on-surface-muted)', fontStyle: 'italic', textAlign: 'center' }}>No notes yet. Record your kitchen variations here.</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} style={{
                            padding: '20px',
                            background: 'rgba(235, 220, 178, 0.03)',
                            borderRadius: '12px',
                            borderLeft: '3px solid var(--color-primary)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {new Date(note.created_at).toLocaleDateString('en-GB', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </span>
                                {isEditable && (
                                    <button
                                        onClick={() => onDeleteNote(note.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-on-surface-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-on-surface)', lineHeight: '1.6' }}>
                                {note.content}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
