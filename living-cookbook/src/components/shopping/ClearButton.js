import { Icon } from "@/components/icons";

/**
 * ClearButton — shared destructive action button used by both Standard and
 * Pro Kitchen list views to wipe all items from the currently-visible list.
 * Extracted from shopping/page.js (B10).
 */
export default function ClearButton({ onClear, label }) {
    return (
        <div style={{ marginTop: "20px", padding: "10px 0" }}>
            <button onClick={onClear} style={{
                width: "100%", padding: "16px", borderRadius: "16px",
                background: "transparent", color: "rgba(255,107,107,0.8)",
                border: "1px dashed rgba(255,107,107,0.4)", fontSize: "0.9rem",
                fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
            }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,107,107,0.05)"; e.target.style.borderColor = "#ff6b6b"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,107,107,0.4)"; }}
            >
                {Icon.trash} Clear {label} List
            </button>
        </div>
    );
}
