import type { Widget, BoardDiff, SpecKey, ExplicitOps } from "../api/types.js";
import { SPEC_KEYS } from "../api/types.js";

export function parseExplicitOps(input: ExplicitOps): BoardDiff {
  const diff: BoardDiff = { creates: [], updates: [], deletes: [] };

  if (input.create) {
    for (const [key, widgets] of Object.entries(input.create)) {
      const specKey = key as SpecKey;
      if (!SPEC_KEYS.includes(specKey)) {
        throw new Error(`Invalid spec key in create: "${key}"`);
      }
      for (const w of widgets!) {
        if (w.id) {
          throw new Error(
            `Widget in create must not have an id (got "${w.id}" in ${specKey})`,
          );
        }
      }
      diff.creates.push({ specKey, widgets: widgets! });
    }
  }

  if (input.update) {
    for (const [key, widgets] of Object.entries(input.update)) {
      const specKey = key as SpecKey;
      if (!SPEC_KEYS.includes(specKey)) {
        throw new Error(`Invalid spec key in update: "${key}"`);
      }
      for (const w of widgets!) {
        if (!w.id) {
          throw new Error(
            `Widget in update must have an id (missing in ${specKey})`,
          );
        }
        const { id, ...fields } = w;
        if (Object.keys(fields).length === 0) {
          throw new Error(
            `Widget in update must have at least one field besides id (widget "${id}" in ${specKey})`,
          );
        }
        diff.updates.push({ specKey, widgetId: id, fields });
      }
    }
  }

  if (input.delete) {
    for (const id of input.delete) {
      if (typeof id !== "string" || !id) {
        throw new Error(`Delete list must contain non-empty string IDs`);
      }
      diff.deletes.push(id);
    }
  }

  return diff;
}
