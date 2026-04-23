/**
 * SourceReferenceFields
 *
 * Presentational component — renders the 5 controlled source inputs.
 * All state lives in the parent (add/page.js) because handleSubmit needs it.
 */
export default function SourceReferenceFields({
    bookTitle, setBookTitle,
    author,    setAuthor,
    publisher, setPublisher,
    pageNumber, setPageNumber,
    link,      setLink,
}) {
    return (
        <>
            <div className="form-row" style={{ marginBottom: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Book / Website Title</label>
                    <input
                        type="text"
                        className="form-control"
                        value={bookTitle}
                        onChange={e => setBookTitle(e.target.value)}
                        placeholder="e.g. The Essentials of Classic Italian Cooking"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Author</label>
                    <input
                        type="text"
                        className="form-control"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        placeholder="e.g. Marcella Hazan"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Publisher</label>
                    <input
                        type="text"
                        className="form-control"
                        value={publisher}
                        onChange={e => setPublisher(e.target.value)}
                        placeholder="e.g. Alfred A. Knopf"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 120px' }}>
                    <label>Page #</label>
                    <input
                        type="text"
                        className="form-control"
                        value={pageNumber}
                        onChange={e => setPageNumber(e.target.value)}
                        placeholder="e.g. 214"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>URL Link</label>
                    <input
                        type="text"
                        className="form-control"
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            </div>
        </>
    );
}
