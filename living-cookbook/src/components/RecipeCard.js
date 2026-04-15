import Link from "next/link";
import ImageCarousel from "./ImageCarousel";

export default function RecipeCard({ recipe, hrefOverride }) {
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

    return (
        <Link href={hrefOverride ?? `/recipe/${recipe.id}`} className="recipe-card-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <article className="recipe-card">
                <div className="recipe-card-img-wrapper">
                    <ImageCarousel 
                        images={recipe.images?.length > 0 ? recipe.images : (recipe.image ? [recipe.image] : [])} 
                        title={recipe.title} 
                        type="card"
                    />
                </div>
                <div className="recipe-card-content">
                    <h2 className="recipe-card-title font-heading">{recipe.title}</h2>
                    <div className="recipe-card-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {totalTime} mins
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                            {recipe.sources?.book_title || recipe.sources?.author || "Custom"}
                        </span>
                    </div>
                    <div className="recipe-card-tags">
                        {(recipe.tags || []).map((tag, i) => (
                            <span key={i} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>
            </article>
        </Link>
    );
}
