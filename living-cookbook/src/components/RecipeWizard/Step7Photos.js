'use client';

import ImageManager from '@/components/ImageManager';
import styles from './Step7Photos.module.css';

/**
 * Step 7 — Photos
 *
 * Props:
 *   imageUrls         {string[]}
 *   aiImagesUsed      {number}
 *   lastBrief         {object|null}
 *   recipeTitle       {string}
 *   onImagesChange    {fn(urls)}
 */
export default function Step7Photos({ imageUrls, aiImagesUsed, lastBrief, recipeTitle, onImagesChange }) {
    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Photos</h2>

            <p className={styles.hint}>
                Add photos of your dish — you can add more any time from the recipe page.
                This step is optional.
            </p>

            <ImageManager
                images={imageUrls}
                aiImagesUsed={aiImagesUsed}
                lastBrief={lastBrief}
                onAiGenerate={() => {}}
                onChange={onImagesChange}
            />
        </div>
    );
}
