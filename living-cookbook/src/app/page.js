"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function GalleryPage() {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const { data, error: dbError } = await supabase
          .from("recipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        setRecipes(data || []);
      } catch (err) {
        console.error("Failed to load recipes", err);
        setError("Error connecting to database. Please check your Supabase credentials.");
      }
    }
    loadGallery();

    // Re-fetch whenever the user navigates back to this tab/page
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadGallery();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div className="view-gallery" style={{ display: 'block' }}>
      <header className="gallery-header">
        <h1 className="gallery-title font-heading">The Living Cookbook</h1>
        <div className="gallery-actions" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <div className="gallery-search">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginRight: "10px", opacity: 0.6 }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search recipes..." />
          </div>
          <Link href="/add" className="btn-add-recipe">
            + Add Recipe
          </Link>
        </div>
      </header>

      {error ? (
        <p style={{ color: "var(--color-accent-amber)" }}>{error}</p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => {
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
            return (
              <Link href={`/recipe/${recipe.id}`} key={recipe.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article className="recipe-card">
                  <div className="recipe-card-img-wrapper">
                    <img
                      src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670"}
                      alt={recipe.title}
                      className="recipe-card-img"
                    />
                  </div>
                  <div className="recipe-card-content">
                    <h2 className="recipe-card-title font-heading">{recipe.title}</h2>
                    <div className="recipe-card-meta">
                      <span>⏱️ {totalTime} mins</span>
                      <span>📖 {recipe.reference_source || "Custom"}</span>
                    </div>
                    <div className="recipe-card-tags">
                      {(recipe.tags || []).map((tag, i) => (
                        <span key={i} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
