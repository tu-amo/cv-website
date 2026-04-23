"use client";

import { useState } from "react";

const OPTIONS = [
    {
        value: "metric",
        flag: "🌍",
        label: "Metric",
        hint: "Grams, millilitres, °C — international standard",
    },
    {
        value: "uk_imperial",
        flag: "🇬🇧",
        label: "UK Imperial",
        hint: "Ounces, UK pint (568ml), tablespoons, °C",
    },
    {
        value: "us_imperial",
        flag: "🇺🇸",
        label: "US Customary",
        hint: "Cups, US fluid oz, US pint (473ml), °F",
    },
];

/**
 * MeasurementFieldset
 *
 * Client component so that clicking a radio option immediately updates the
 * label highlight. The server component (profile/page.js) passes in the
 * initial value from the DB via `defaultValue`; the selected state is then
 * owned here and drives the visual styles on every click.
 *
 * The hidden <input name="unit_system"> keeps the form submission correct —
 * the radio inputs still carry the value, but we use a controlled hidden
 * input as belt-and-braces so the controlled `selected` state is always what
 * is submitted.
 */
export function MeasurementFieldset({ defaultValue, labelStyle }) {
    const [selected, setSelected] = useState(defaultValue ?? "metric");

    return (
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ ...labelStyle, marginBottom: "16px" }}>Choose your system</legend>

            {/* Hidden input that always carries the current selection to the server action */}
            <input type="hidden" name="unit_system" value={selected} />

            {OPTIONS.map(opt => {
                const isSelected = selected === opt.value;
                return (
                    <label
                        key={opt.value}
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "14px",
                            padding: "16px",
                            borderRadius: "12px",
                            /* Dynamic — driven by selected state: inline is correct */
                            border: `1px solid ${isSelected ? "var(--color-primary)" : "rgba(255,255,255,0.07)"}`,
                            background: isSelected ? "rgba(176,173,218,0.06)" : "transparent",
                            cursor: "pointer",
                            marginBottom: "10px",
                            minHeight: "44px",
                            transition: "border-color 0.15s ease, background 0.15s ease",
                        }}
                    >
                        <input
                            type="radio"
                            name="_unit_system_visual"
                            value={opt.value}
                            checked={isSelected}
                            onChange={() => setSelected(opt.value)}
                            style={{ marginTop: "3px", accentColor: "var(--color-primary)", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 }}>{opt.flag}</span>
                        <span>
                            <strong style={{ color: "var(--color-on-surface)", fontSize: "0.95rem", display: "block" }}>
                                {opt.label}
                            </strong>
                            <span style={{ color: "var(--color-on-surface-muted)", fontSize: "0.78rem" }}>
                                {opt.hint}
                            </span>
                        </span>
                    </label>
                );
            })}
        </fieldset>
    );
}
