// Pure, DB-free core of the LGD importer: CSV parsing + validation + counts.
// Kept separate so it can be unit-tested without a database connection.

export const LEVELS = new Set(["state", "district", "subdistrict", "village", "local_body"]);

export const norm = (s) =>
  String(s ?? "").normalize("NFKC").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

// Minimal CSV parser (handles quoted fields and commas within quotes).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}

/** Parse + validate an LGD CSV. `existingCodes` is the set of codes already in the
 *  DB (so a parent defined earlier still counts as present). Returns records,
 *  per-level counts, an errors report, and whether any blocking error was found. */
export function parseAndValidate(csvText, existingCodes = new Set()) {
  const rows = parseCsv(csvText);
  const errors = { duplicates: [], missing_parents: [], cycles: [], inactive: [], malformed: [] };
  const records = [];
  const byCode = new Map();
  if (!rows.length) return { records, counts: {}, errors, hasBlocking: false, empty: true };
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const get = (r, name) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");

  for (const r of rows) {
    const level = get(r, "level");
    const code = get(r, "code");
    const name = get(r, "name");
    if (!LEVELS.has(level) || !code || !name) { errors.malformed.push({ level, code, name }); continue; }
    if (byCode.has(code)) { errors.duplicates.push(code); continue; }
    const activeRaw = get(r, "active");
    const active = activeRaw === "" ? 1 : (activeRaw === "0" || norm(activeRaw) === "inactive" ? 0 : 1);
    if (!active) errors.inactive.push(code);
    const rec = {
      code, level, name,
      parent_code: get(r, "parent_code") || null,
      name_local: get(r, "name_local") || null,
      lgd_code: get(r, "lgd_code") || code,
      parent_lgd_code: get(r, "parent_lgd_code") || null,
      state_code: get(r, "state_code") || (level === "state" ? code : null),
      active,
      effective_date: get(r, "effective_date") || null,
      aliases: (get(r, "aliases") || "").split(";").map((s) => s.trim()).filter(Boolean),
    };
    records.push(rec);
    byCode.set(code, rec);
  }

  // Missing parents: parent not in file and not already in DB.
  for (const rec of records) {
    if (rec.parent_code && !byCode.has(rec.parent_code) && !existingCodes.has(rec.parent_code)) {
      errors.missing_parents.push({ code: rec.code, parent_code: rec.parent_code });
    }
  }
  // Cycles: follow the parent chain within the file.
  for (const rec of records) {
    const seen = new Set();
    let cur = rec;
    while (cur && cur.parent_code) {
      if (seen.has(cur.code)) { errors.cycles.push(rec.code); break; }
      seen.add(cur.code);
      cur = byCode.get(cur.parent_code);
    }
  }

  const counts = {};
  for (const rec of records) counts[rec.level] = (counts[rec.level] ?? 0) + 1;
  const hasBlocking = !!(errors.duplicates.length || errors.missing_parents.length || errors.cycles.length || errors.malformed.length);
  return { records, counts, errors, hasBlocking, empty: false };
}
