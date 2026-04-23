'use client';

import styles from './Step6Visibility.module.css';

/**
 * Step 6 — Visibility
 *
 * Props:
 *   isPublic        {boolean}
 *   selectedGroupId {string|null}
 *   groups          {array}   [{id, name}]
 *   onSetPrivate    {fn}
 *   onSetHousehold  {fn(groupId)}
 *   onSetPublic     {fn}
 */
export default function Step6Visibility({ isPublic, selectedGroupId, groups, onSetPrivate, onSetHousehold, onSetPublic }) {
    const isPrivate = !isPublic && !selectedGroupId;
    const isHousehold = !!selectedGroupId;

    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Who can see this recipe?</h2>

            <p className={styles.hint}>
                You can always change visibility later from the recipe page.
            </p>

            <div className={styles.options} role="group" aria-label="Recipe visibility options">

                {/* Private */}
                <button
                    type="button"
                    className={`${styles.option} ${isPrivate ? styles.selected : ''}`}
                    onClick={onSetPrivate}
                    role="switch"
                    aria-checked={isPrivate}
                    aria-label="Private — only you can see this recipe"
                >
                    <span className={`${styles.switchTrack} ${isPrivate ? styles.on : ''}`} aria-hidden="true">
                        <span className={styles.switchThumb} />
                    </span>
                    <div className={styles.optionBody}>
                        <p className={styles.optionTitle}>🔒 Private</p>
                        <p className={styles.optionDesc}>Only you can see this recipe.</p>
                    </div>
                </button>

                {/* Household — only shown when user has groups */}
                {groups.length > 0 && (
                    <>
                        <button
                            type="button"
                            className={`${styles.option} ${isHousehold ? styles.selected : ''}`}
                            onClick={() => {
                                // If not yet household, default to first group
                                if (!isHousehold) onSetHousehold(groups[0].id);
                            }}
                            role="switch"
                            aria-checked={isHousehold}
                            aria-label="Household — share with a household or kitchen"
                        >
                            <span className={`${styles.switchTrack} ${isHousehold ? styles.on : ''}`} aria-hidden="true">
                                <span className={styles.switchThumb} />
                            </span>
                            <div className={styles.optionBody}>
                                <p className={styles.optionTitle}>🏠 Household / Kitchen</p>
                                <p className={styles.optionDesc}>Share with your household or pro kitchen members.</p>
                            </div>
                        </button>

                        {/* Sub-list of groups */}
                        {isHousehold && (
                            <div className={styles.groupList} role="radiogroup" aria-label="Choose a kitchen">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`${styles.groupOption} ${selectedGroupId === g.id ? styles.selected : ''}`}
                                        onClick={() => onSetHousehold(g.id)}
                                        role="radio"
                                        aria-checked={selectedGroupId === g.id}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Public */}
                <button
                    type="button"
                    className={`${styles.option} ${isPublic ? styles.selected : ''}`}
                    onClick={onSetPublic}
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Public — anyone on Pretzel Prep can see this recipe"
                >
                    <span className={`${styles.switchTrack} ${isPublic ? styles.on : ''}`} aria-hidden="true">
                        <span className={styles.switchThumb} />
                    </span>
                    <div className={styles.optionBody}>
                        <p className={styles.optionTitle}>🌍 Public Gallery</p>
                        <p className={styles.optionDesc}>Visible to everyone on Pretzel Prep.</p>
                    </div>
                </button>

            </div>
        </div>
    );
}
