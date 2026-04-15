# ADR-017: Snapshot-Restore Guard for Delete-Then-Insert Child Row Patterns

## Status
Accepted

## Date
2026-04-08

## Context

The recipe save flow in `src/app/add/page.js` uses a **delete-then-reinsert** pattern to update child rows:

```js
// Old pattern (UNSAFE without a transaction)
await supabase.from("recipe_ingredients").delete().eq("recipe_id", editId);
for (const ing of ingredients) {
    await supabase.from("recipe_ingredients").insert([{ ... }]);
}
```

This pattern is structurally fragile: the DELETE is a committed, non-reversible write. If any subsequent INSERT fails — for any reason — the old rows are gone and no new rows exist. The recipe has no ingredients.

**Why INSERTs fail silently in this codebase:**

PostgREST (the Supabase REST API layer) returns HTTP 400 if an INSERT references a column that does not exist in the database schema. The application catches this per-ingredient and shows a toast, but does not stop the loop or abort the save. The DELETE is irrecoverable.

This exact failure mode caused **LL-043** (2026-04-08): the `preparation` column existed in staging but not in production. Every ingredient INSERT returned 400 after the DELETE committed. All 4 production recipes lost their ingredient data.

**Why a database transaction is not the obvious fix:**

The Supabase JavaScript client (`@supabase/supabase-js`) communicates via PostgREST's REST API, which does not support multi-statement transactions from the client side. Each `.insert()`, `.delete()` etc. is an independent HTTP request. True atomic transactions require either:
- A Postgres function (`SECURITY DEFINER`) called via `.rpc()`, or
- Direct database access (not available from Next.js app routes without bypassing PostgREST)

Neither option is appropriate for a general-purpose form save path where the row data is highly variable and schema-driven.

**Options considered:**

| Option | Notes |
|---|---|
| A — Accept data loss risk | Ruled out — LL-043 proved this causes real user harm |
| B — Move to Postgres function / RPC | Requires a new stored procedure per entity; couples app logic to DB functions; significant complexity for 22-column flexible rows |
| C — Use `upsert` instead of delete+insert | Requires stable IDs across edits; the current ingredient model uses ephemeral client-side IDs (`Date.now()`); UPSERTs would require a stable server-assigned ID to be tracked through the form state |
| D — Snapshot-restore guard in application code | Simple; zero new infrastructure; works within PostgREST constraints — **chosen** |

## Decision

Any code path that performs a **DELETE on child rows before INSERTing replacements** must implement an application-level **snapshot-restore guard**:

1. **Before DELETE:** Read and store all existing child rows into a local variable (`snapshot`).
2. **Proceed with DELETE and INSERT as normal.**
3. **After the loop:** If any INSERT failed, delete the partial rows that were inserted, re-insert the snapshot rows (stripping the auto-generated `id` field so Supabase assigns new IDs), and **abort navigation** with a clear user-facing error.

**Reference implementation** (as deployed in `src/app/add/page.js`):

```js
// 1. Snapshot before DELETE
const { data: snapshot } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .eq('recipe_id', editId);
const existingSnapshot = snapshot || [];

// 2. Proceed with delete + insert loop
await supabase.from('recipe_ingredients').delete().eq('recipe_id', editId);
let anyFailed = false;
for (const row of newRows) {
    const { error } = await supabase.from('recipe_ingredients').insert([row]);
    if (error) {
        anyFailed = true;
        showToast(`⚠️ Could not save: ${row.display_name} — ${error.message}`);
    }
}

// 3. Guard: restore snapshot if any insert failed
if (anyFailed && existingSnapshot.length > 0) {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', editId); // clear partials
    const toRestore = existingSnapshot.map(({ id: _, ...r }) => r);
    await supabase.from('recipe_ingredients').insert(toRestore);
    showToast('❌ Save failed — your original ingredients have been restored.');
    return; // abort navigation
}
```

**Rule:** This pattern applies to **any delete-then-reinsert** on child tables in the application. Currently that includes `recipe_ingredients` and `instruction_steps`. Any future child-row management must evaluate whether this guard is needed.

## Rationale

1. **Data preservation over save success** — it is better to show the user a clear error and leave their data intact than to silently succeed the save while destroying the data.
2. **Respects PostgREST's constraints** — works within the single-request-per-operation model with no new stored procedures or schema changes.
3. **Observable failure** — the toast now includes the actual DB error message (`error.message`), making schema drift and other causes of insert failure immediately diagnosable.
4. **Cheap operation** — the snapshot read is one additional SELECT per save; negligible for recipe-sized data.

## Trade-offs Accepted

- **Extra SELECT per save:** One additional round-trip to the database before every edit save. For the data volumes involved (≤50 ingredient rows), this is immaterial.
- **Not truly atomic:** Between the snapshot read and the DELETE, another write could theoretically modify the rows. In practice, only one user session can edit a single recipe at a time; this race condition is not a realistic concern for the current product.
- **Restore also can fail:** If the restore INSERT itself fails (e.g. a network error), the user is left with no ingredients and no snapshot. This is an improvement over the previous state (always lost data on schema mismatch) but not a guarantee. A future RPC-based approach would be fully atomic.

## Mitigation

- The restore path also shows a clear user-facing error if it fails. In the worst case, the user sees the error and can re-enter ingredients.
- The OBS-009 schema-drift cron was corrected on the same date to catch column mismatches within 24 hours — the primary cause of INSERT failures in this codebase is now proactively monitored.
- Schema changes are now applied via `npm run db:push` (ADR-016) before code that depends on them is deployed, reducing the chance of insert failures due to schema drift.

## Consequences

- **Positive:** Recipe ingredient data is now protected against schema drift and other transient insert failures. Users see a clear error instead of silently losing data.
- **Negative:** The extra SELECT and conditional restore logic adds ~20 lines of code per entity that uses this pattern.
- **Future path:** If the app moves to direct Postgres access (e.g. via Supabase Edge Functions calling `pg` directly), replace this pattern with a native `BEGIN / ROLLBACK` transaction. Similarly, a stable server-assigned ingredient ID tracked through the form state would enable the safer `upsert` approach.

## Revisit Trigger

Reconsider when:
- The app moves to Supabase Edge Functions with direct Postgres access — use `BEGIN / ROLLBACK` instead
- The ingredient form state is refactored to track stable server-assigned IDs — switch to `upsert` (eliminates the delete-then-insert pattern entirely)
- A second entity type (e.g. instruction steps) requires the same guard — extract the pattern into a shared utility function

## Related Decisions

- [ADR-016](ADR-016-supabase-cli-migration-management.md) — CLI-based migrations reduce the primary cause of INSERT failures (schema drift)
- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS policies on `recipe_ingredients` still govern who can read/write; the guard operates within those boundaries
- LL-043 in `LESSONS_LEARNT.md` — the incident this ADR responds to
