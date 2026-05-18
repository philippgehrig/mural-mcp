import type { Widget, BoardSpec, SpecKey } from "../api/types.js";
import { apiTypeToSpecKey, SPEC_KEYS, SERVER_ONLY_FIELDS } from "../api/types.js";
import { MuralClient } from "../api/client.js";

function stripServerFields(widget: Widget): Widget {
  const result: Widget = {};
  for (const [key, value] of Object.entries(widget)) {
    if (!SERVER_ONLY_FIELDS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

function emptySpec(): BoardSpec {
  return {
    areas: [],
    sticky_notes: [],
    textboxes: [],
    titles: [],
    shapes: [],
    arrows: [],
  };
}

export async function extractBoard(
  client: MuralClient,
  muralId: string,
): Promise<BoardSpec> {
  const rawWidgets = await client.getWidgets(muralId);
  const spec = emptySpec();

  for (const widget of rawWidgets) {
    const apiType = widget.type as string;
    let specKey: SpecKey;
    try {
      specKey = apiTypeToSpecKey(apiType);
    } catch {
      continue; // skip unknown widget types
    }
    spec[specKey].push(stripServerFields(widget));
  }

  return spec;
}

export { stripServerFields, emptySpec };
