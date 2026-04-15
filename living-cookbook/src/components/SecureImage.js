"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * A component that handles Supabase Storage images securely.
 * If the source is a Supabase storage path, it generates a (short-lived) signed URL.
 * If the source is a regular URL, it just displays it.
 *
 * Performance props:
 *   fetchpriority - "high" for above-the-fold hero images (boosts LCP)
 *   loading       - "eager" | "lazy" (default: "lazy")
 */

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670";

export default function SecureImage({ src, alt, className, style, loading = "lazy", fetchpriority, onError }) {
    const isStoragePath = src && !src.startsWith('http') && !src.startsWith('blob:');
    const [displayUrl, setDisplayUrl] = useState(isStoragePath ? null : src);
    const [isResolving, setIsResolving] = useState(isStoragePath);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!src) return;

        if (isStoragePath) {
            resolveSecureUrl(src);
        } else {
            setDisplayUrl(src);
            setIsResolving(false);
        }
    }, [src]);

    const resolveSecureUrl = async (path) => {
        setIsResolving(true);
        try {
            const { data, error } = await supabase.storage
                .from('recipe-images')
                .createSignedUrl(path, 3600);

            if (error) throw error;
            setDisplayUrl(data.signedUrl);
        } catch (err) {
            // Signed URL generation fails for unauthenticated users on private buckets.
            // Supabase returns "Object not found" rather than "Unauthorized" by design.
            // Fall through to the Unsplash placeholder silently.
            console.warn('[SecureImage] Could not resolve signed URL — falling back to placeholder:', err.message);
            setDisplayUrl(FALLBACK_IMAGE);
        } finally {
            setIsResolving(false);
        }
    };

    // Show a skeleton shimmer while the signed URL is being resolved
    if (isResolving && !displayUrl) {
        return <div className={`${className} skeleton-shimmer`} style={{ ...style, background: 'var(--color-surface-hover)' }} />;
    }

    return (
        <img 
            src={displayUrl} 
            alt={alt} 
            className={className} 
            style={style} 
            loading={loading}
            fetchPriority={fetchpriority}
            onError={onError}
        />
    );
}
