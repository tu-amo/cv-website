'use client';

import styles from './Step2Source.module.css';

const SOURCE_TYPES = [
    { id: 'none',     icon: '👤', label: 'Original',   sub: 'My own recipe' },
    { id: 'family',   icon: '🏠', label: 'Family',     sub: 'Someone\'s recipe' },
    { id: 'cookbook', icon: '📖', label: 'Cookbook',   sub: 'Book or magazine' },
    { id: 'website',  icon: '🔗', label: 'Website',    sub: 'Online recipe' },
];

/**
 * Step 2 — Recipe Title & Source
 *
 * Props:
 *   title, setTitle
 *   sourceType, setSourceType  ('none' | 'family' | 'cookbook' | 'website')
 *   bookTitle, setBookTitle
 *   author, setAuthor
 *   publisher, setPublisher
 *   pageNumber, setPageNumber
 *   link, setLink
 */
export default function Step2Source({
    title, setTitle,
    sourceType, setSourceType,
    bookTitle, setBookTitle,
    author, setAuthor,
    publisher, setPublisher,
    pageNumber, setPageNumber,
    link, setLink,
}) {
    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Title &amp; Source</h2>

            {/* ── Recipe title ──────────────────────────────────────── */}
            <div className={styles.field}>
                <label className={styles.label} htmlFor="wiz-title">Recipe title</label>
                <input
                    id="wiz-title"
                    className="form-control"
                    type="text"
                    placeholder="e.g. Grandma's Beef Stew"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoComplete="off"
                />
            </div>

            {/* ── Source type ───────────────────────────────────────── */}
            <div>
                <p className={styles.label} id="source-type-label">Where is this recipe from?</p>
                <p className={styles.hint}>
                    Epistemic justice matters — crediting the origin of a recipe honours the
                    people and cultures behind it.
                </p>
                <div
                    className={styles.typeGrid}
                    role="radiogroup"
                    aria-labelledby="source-type-label"
                    style={{ marginTop: '12px' }}
                >
                    {SOURCE_TYPES.map(({ id, icon, label, sub }) => (
                        <button
                            key={id}
                            type="button"
                            className={`${styles.typeCard} ${sourceType === id ? styles.selected : ''}`}
                            role="radio"
                            aria-checked={sourceType === id}
                            onClick={() => setSourceType(id)}
                        >
                            <span className={styles.typeIcon} aria-hidden="true">{icon}</span>
                            <span className={styles.typeLabel}>{label}</span>
                            <span className={styles.typeSub}>{sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Conditional source fields ─────────────────────────── */}
            {sourceType === 'family' && (
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-author">Whose recipe is it?</label>
                        <input id="wiz-author" className="form-control" type="text"
                            placeholder="e.g. Mama Aigerim, Nani, Uncle Pita…"
                            value={author} onChange={e => setAuthor(e.target.value)} />
                        <p className={styles.hint2}>Their name will be credited on the recipe page.</p>
                    </div>
                </div>
            )}

            {sourceType === 'cookbook' && (
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-book">Book or magazine title</label>
                        <input id="wiz-book" className="form-control" type="text"
                            placeholder="e.g. Plenty by Yotam Ottolenghi"
                            value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-author2">Author</label>
                        <input id="wiz-author2" className="form-control" type="text"
                            placeholder="e.g. Yotam Ottolenghi"
                            value={author} onChange={e => setAuthor(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-publisher">Publisher <span style={{ fontWeight: 400 }}>(optional)</span></label>
                        <input id="wiz-publisher" className="form-control" type="text"
                            placeholder="e.g. Ebury Press"
                            value={publisher} onChange={e => setPublisher(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-book-url">Buy / view online <span style={{ fontWeight: 400 }}>(optional)</span></label>
                        <input id="wiz-book-url" className="form-control" type="url"
                            placeholder="e.g. https://www.amazon.com/dp/..."
                            value={link} onChange={e => setLink(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-page">Page number <span style={{ fontWeight: 400 }}>(optional)</span></label>
                        <input id="wiz-page" className="form-control" type="number"
                            placeholder="e.g. 142"
                            value={pageNumber} onChange={e => setPageNumber(e.target.value)} />
                    </div>
                </div>
            )}

            {sourceType === 'website' && (
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-link">Website URL</label>
                        <input id="wiz-link" className="form-control" type="url"
                            placeholder="https://www.example.com/recipe"
                            value={link} onChange={e => setLink(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-author3">Author / blog name <span style={{ fontWeight: 400 }}>(optional)</span></label>
                        <input id="wiz-author3" className="form-control" type="text"
                            placeholder="e.g. Samin Nosrat / Salt Fat Acid Heat"
                            value={author} onChange={e => setAuthor(e.target.value)} />
                    </div>
                </div>
            )}
        </div>
    );
}
