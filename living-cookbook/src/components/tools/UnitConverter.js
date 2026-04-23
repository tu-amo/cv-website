"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import styles from "@/components/tools/RecipeScaler.module.css";

// ── Conversion constants ──────────────────────────────────────────────────────

const WEIGHT = {
  gToOz:  (g)  => g / 28.3495,
  ozToG:  (oz) => oz * 28.3495,
  gToLb:  (g)  => g / 453.592,
  lbToG:  (lb) => lb * 453.592,
  kgToOz: (kg) => kg * 1000 / 28.3495,
  ozToKg: (oz) => oz * 28.3495 / 1000,
  kgToLb: (kg) => kg * 1000 / 453.592,
  lbToKg: (lb) => lb * 453.592 / 1000,
};

const VOL_ML = {
  uk: { floz: 28.4131, pint: 568.261, cup: 250,     tbsp: 17.7582, tsp: 5.9194 },
  us: { floz: 29.5735, pint: 473.176, cup: 236.588, tbsp: 14.7868, tsp: 4.9289 },
};

function mlToImp(ml,  unit, region) { return ml / VOL_ML[region][unit]; }
function impToMl(val, unit, region) { return val * VOL_ML[region][unit]; }
function lToImp(l,   unit, region) { return (l * 1000) / VOL_ML[region][unit]; }
function impToL(val, unit, region) { return (val * VOL_ML[region][unit]) / 1000; }
function cToF(c) { return c * 9 / 5 + 32; }
function fToC(f) { return (f - 32) * 5 / 9; }

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return "";
  const abs = Math.abs(n);
  if (abs === 0)    return "0";
  if (abs >= 1000)  return n.toFixed(1).replace(/\.0$/, "");
  if (abs >= 100)   return n.toFixed(2).replace(/\.?0+$/, "");
  if (abs >= 10)    return n.toFixed(3).replace(/\.?0+$/, "");
  return n.toFixed(4).replace(/\.?0+$/, "");
}

// ── SectionCard ────────────────────────────────────────────────────────────────
// The title is a visual section label, not a document heading — use pp-overline
// (a <p> tag sized at 0.7rem/uppercase/muted) rather than an <h2> with inline styles.

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-hairline)",  /* §A: --color-hairline (was --color-divider) */
      borderRadius: "var(--radius-md)",
      padding: "28px 28px 24px",
      marginBottom: "16px",
    }}>
      <p className="pp-overline" style={{ marginBottom: "16px" }}>{title}</p>
      {children}
    </div>
  );
}

// ── ConvRow ────────────────────────────────────────────────────────────────────
// Metric field has the primary/amber border (dynamic — inline ok).
// Imperial field uses a standard hairline border.
// Labels use --color-on-surface-muted (§A).

function ConvRow({ metricLabel, imperialLabel, metricValue, imperialValue, onMetricChange, onImpChange }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: "12px",
      marginBottom: "14px",
    }}>
      {/* Metric — primary field */}
      <div>
        <label style={{ fontSize: "0.72rem", color: "var(--color-on-surface-muted)", display: "block", marginBottom: "4px" }}>
          {metricLabel}
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={metricValue}
          onChange={e => onMetricChange(e.target.value)}
          placeholder="0"
          style={{
            width: "100%",
            background: "var(--color-bg)",
            border: "1.5px solid var(--color-primary)",  /* §A: --color-primary (was --color-accent-amber) */
            borderRadius: "10px",
            color: "var(--color-on-surface)",             /* §A: --color-on-surface (was --color-text-papyrus) */
            padding: "10px 14px",
            fontSize: "1.05rem",
            fontVariantNumeric: "tabular-nums",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Divider arrow — static, muted */}
      <div style={{ color: "var(--color-on-surface-muted)", fontSize: "1.1rem", userSelect: "none", paddingTop: "18px" }}>
        ⇄
      </div>

      {/* Imperial field */}
      <div>
        <label style={{ fontSize: "0.72rem", color: "var(--color-on-surface-muted)", display: "block", marginBottom: "4px" }}>
          {imperialLabel}
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={imperialValue}
          onChange={e => onImpChange(e.target.value)}
          placeholder="0"
          style={{
            width: "100%",
            background: "var(--color-bg)",
            border: "1px solid var(--color-hairline)",  /* §A: --color-hairline (was --color-divider) */
            borderRadius: "10px",
            color: "var(--color-on-surface)",            /* §A: --color-on-surface (was --color-text-papyrus) */
            padding: "10px 14px",
            fontSize: "1.05rem",
            fontVariantNumeric: "tabular-nums",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

// ── Weight section ─────────────────────────────────────────────────────────────

function WeightSection({ copy }) {
  const [g,  setG]  = useState(""); const [oz, setOz] = useState("");
  const [kg, setKg] = useState(""); const [lb, setLb] = useState("");

  const fromG  = (v) => { setG(v);  const n = parseFloat(v); setOz(n ? fmt(WEIGHT.gToOz(n))  : ""); };
  const fromOz = (v) => { setOz(v); const n = parseFloat(v); setG(n  ? fmt(WEIGHT.ozToG(n))  : ""); };
  const fromKg = (v) => { setKg(v); const n = parseFloat(v); setLb(n ? fmt(WEIGHT.kgToLb(n)) : ""); };
  const fromLb = (v) => { setLb(v); const n = parseFloat(v); setKg(n ? fmt(WEIGHT.lbToKg(n)) : ""); };

  return (
    <SectionCard title={copy.weightTitle}>
      <ConvRow metricLabel={copy.weightUnits.g}  imperialLabel={copy.weightUnits.oz}
        metricValue={g}  imperialValue={oz} onMetricChange={fromG}  onImpChange={fromOz} />
      <ConvRow metricLabel={copy.weightUnits.kg} imperialLabel={copy.weightUnits.lb}
        metricValue={kg} imperialValue={lb} onMetricChange={fromKg} onImpChange={fromLb} />
    </SectionCard>
  );
}

// ── Volume section ─────────────────────────────────────────────────────────────

function VolumeSection({ copy, region }) {
  const [ml_floz, setMl_floz] = useState(""); const [floz, setFloz] = useState("");
  const [l_pint,  setL_pint]  = useState(""); const [pint, setPint] = useState("");
  const [l_cup,   setL_cup]   = useState(""); const [cup,  setCup]  = useState("");
  const [ml_tbsp, setMl_tbsp] = useState(""); const [tbsp, setTbsp] = useState("");
  const [ml_tsp,  setMl_tsp]  = useState(""); const [tsp,  setTsp]  = useState("");

  const fromMlFloz = (v) => { setMl_floz(v); const n=parseFloat(v); setFloz(n ? fmt(mlToImp(n,"floz",region)) : ""); };
  const fromFloz   = (v) => { setFloz(v);    const n=parseFloat(v); setMl_floz(n ? fmt(impToMl(n,"floz",region)) : ""); };
  const fromLPint  = (v) => { setL_pint(v);  const n=parseFloat(v); setPint(n ? fmt(lToImp(n,"pint",region)) : ""); };
  const fromPint   = (v) => { setPint(v);    const n=parseFloat(v); setL_pint(n ? fmt(impToL(n,"pint",region)) : ""); };
  const fromLCup   = (v) => { setL_cup(v);   const n=parseFloat(v); setCup(n ? fmt(lToImp(n,"cup",region)) : ""); };
  const fromCup    = (v) => { setCup(v);     const n=parseFloat(v); setL_cup(n ? fmt(impToL(n,"cup",region)) : ""); };
  const fromMlTbsp = (v) => { setMl_tbsp(v); const n=parseFloat(v); setTbsp(n ? fmt(mlToImp(n,"tbsp",region)) : ""); };
  const fromTbsp   = (v) => { setTbsp(v);    const n=parseFloat(v); setMl_tbsp(n ? fmt(impToMl(n,"tbsp",region)) : ""); };
  const fromMlTsp  = (v) => { setMl_tsp(v);  const n=parseFloat(v); setTsp(n ? fmt(mlToImp(n,"tsp",region)) : ""); };
  const fromTsp    = (v) => { setTsp(v);     const n=parseFloat(v); setMl_tsp(n ? fmt(impToMl(n,"tsp",region)) : ""); };

  return (
    <SectionCard title={`${copy.volumeTitle} — ${region === "uk" ? copy.ukLabel : copy.usLabel}`}>
      <ConvRow metricLabel={copy.volumeUnits.ml} imperialLabel={copy.volumeUnits.floz}
        metricValue={ml_floz} imperialValue={floz} onMetricChange={fromMlFloz} onImpChange={fromFloz} />
      <ConvRow metricLabel={copy.volumeUnits.l}  imperialLabel={copy.volumeUnits.pint}
        metricValue={l_pint}  imperialValue={pint} onMetricChange={fromLPint}  onImpChange={fromPint} />
      <ConvRow metricLabel={copy.volumeUnits.l}  imperialLabel={copy.volumeUnits.cup}
        metricValue={l_cup}   imperialValue={cup}  onMetricChange={fromLCup}   onImpChange={fromCup} />
      <ConvRow metricLabel={copy.volumeUnits.ml} imperialLabel={copy.volumeUnits.tbsp}
        metricValue={ml_tbsp} imperialValue={tbsp} onMetricChange={fromMlTbsp} onImpChange={fromTbsp} />
      <ConvRow metricLabel={copy.volumeUnits.ml} imperialLabel={copy.volumeUnits.tsp}
        metricValue={ml_tsp}  imperialValue={tsp}  onMetricChange={fromMlTsp}  onImpChange={fromTsp} />
    </SectionCard>
  );
}

// ── Temperature section ────────────────────────────────────────────────────────

function TempSection({ copy }) {
  const [c, setC] = useState(""); const [f, setF] = useState("");
  const fromC = (v) => { setC(v); const n=parseFloat(v); setF(!isNaN(n) ? fmt(cToF(n)) : ""); };
  const fromF = (v) => { setF(v); const n=parseFloat(v); setC(!isNaN(n) ? fmt(fToC(n)) : ""); };
  return (
    <SectionCard title={copy.tempTitle}>
      <ConvRow metricLabel={copy.tempUnits.c} imperialLabel={copy.tempUnits.f}
        metricValue={c} imperialValue={f} onMetricChange={fromC} onImpChange={fromF} />
    </SectionCard>
  );
}

// ── Region toggle ─────────────────────────────────────────────────────────────
// The active state (dynamic background/color) justifies inline styles here.

function RegionToggle({ region, setRegion, copy }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "10px",
      background: "var(--color-surface)",
      border: "1px solid var(--color-hairline)",  /* §A */
      borderRadius: "var(--radius-sm)",
      padding: "8px 16px",
      marginBottom: "28px", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: "0.8rem", color: "var(--color-on-surface-muted)", fontWeight: 600 }}>
        {copy.regionToggle}
      </span>
      {["uk", "us"].map(r => (
        <button key={r} onClick={() => setRegion(r)} style={{
          padding: "5px 16px", borderRadius: "var(--radius-sm)", border: "none",
          cursor: "pointer", fontSize: "0.85rem", fontWeight: region === r ? 700 : 500,
          /* Dynamic — driven by region state: inline is correct per decision tree */
          background: region === r ? "var(--color-primary)"           : "var(--color-surface-container)",
          color:      region === r ? "var(--color-on-primary-container)" : "var(--color-on-surface-muted)",
          transition: "all var(--motion-fast)",
        }}>
          {r === "uk" ? copy.ukLabel : copy.usLabel}
        </button>
      ))}
      <span style={{ fontSize: "0.73rem", color: "var(--color-on-surface-muted)", fontStyle: "italic" }}>
        {region === "uk" ? "pint = 568 ml · tbsp = 17.76 ml" : "pint = 473 ml · tbsp = 14.79 ml"}
      </span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
// Outer shell: pp-page-card (architecture rule — all interior/tool pages).
// Header: <PageHeader> with overline and subtitle props.
// Section labels: pp-overline via SectionCard (not <h2> with inline styles).
// Section headings (supporting, FAQ): pp-section-heading.
// CTA: maps to RecipeScaler.module.css .ctaBanner / .ctaText / .ctaBtn classes.

export function UnitConverter({ copy }) {
  const [region, setRegion] = useState("uk");

  return (
    <div className="pp-page-card">

      <PageHeader
        overline={copy.overline}
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <RegionToggle region={region} setRegion={setRegion} copy={copy} />

      <WeightSection copy={copy} />
      <VolumeSection copy={copy} region={region} key={region} />
      <TempSection copy={copy} />

      {/* CTA — uses RecipeScaler module classes (§A tokens throughout) */}
      <div className={styles.ctaBanner}>
        <div className={styles.ctaText}>
          <span className={styles.ctaHeadline}>{copy.saveHeadline}</span>
          <span className={styles.ctaBody}>{copy.saveBody}</span>
        </div>
        <Link href="/signup" className={styles.ctaBtn}>{copy.saveBtn}</Link>
      </div>

      {/* Supporting SEO content */}
      <div className={styles.supporting}>
        <h2 className="pp-section-heading">{copy.supportingTitle}</h2>
        {copy.supportingBody.map((p, i) => (
          <p key={i} className={styles.supportingPara}>{p}</p>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: "var(--space-8)" }}>
        <h2 className="pp-section-heading">{copy.faqTitle}</h2>
        <dl className={styles.faqList}>
          {copy.faqs.map((item, i) => (
            <div key={i} className={styles.faqItem}>
              <dt className={styles.faqQ}>{item.q}</dt>
              <dd className={styles.faqA}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
