// Translation-completeness checks for reviewed static locales. Run via `npm test`
// (node --test). CI fails if a reviewed locale is missing a message id, has an extra
// id, leaves one empty, or drops/changes a {placeholder}. Machine-translated locales
// are produced at runtime from the canonical catalogue and are not checked here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL, DICTS, MESSAGE_IDS, STATIC_LOCALES } from "./messages.ts";

const placeholders = (s: string): string[] => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();

test("canonical (en) has no empty strings", () => {
  for (const id of MESSAGE_IDS) {
    assert.ok(CANONICAL[id] && CANONICAL[id].trim().length > 0, `empty canonical: ${id}`);
  }
});

for (const locale of STATIC_LOCALES) {
  if (locale === "en") continue;
  const dict = DICTS[locale] as Record<string, string>;

  test(`[${locale}] covers every message id with no empties`, () => {
    for (const id of MESSAGE_IDS) {
      assert.ok(id in dict, `[${locale}] missing message id: ${id}`);
      assert.ok(dict[id] && dict[id].trim().length > 0, `[${locale}] empty: ${id}`);
    }
  });

  test(`[${locale}] has no extra/unknown message ids`, () => {
    const known = new Set<string>(MESSAGE_IDS);
    for (const id of Object.keys(dict)) {
      assert.ok(known.has(id), `[${locale}] unknown message id: ${id}`);
    }
  });

  test(`[${locale}] preserves every {placeholder}`, () => {
    for (const id of MESSAGE_IDS) {
      assert.deepEqual(
        placeholders(dict[id] ?? ""),
        placeholders(CANONICAL[id]),
        `[${locale}] placeholder mismatch in ${id}`,
      );
    }
  });
}
