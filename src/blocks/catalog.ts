import type { AnyBlockDefinition } from "./types";
import { heroBlock } from "./hero";
import { servicesBlock } from "./services";
import { reviewsBlock } from "./reviews";
import { galleryBlock } from "./gallery";
import { contactBlock } from "./contact";

/**
 * Block catalog v1 — the single registry of available blocks.
 *
 * Both the runtime renderer (Step 6) and the visual editor (Step 7) read from this catalog, so
 * there is exactly one source of truth for which blocks exist and how they render. Keys are the
 * stable `type` identifiers stored in block JSON.
 */
export const blockCatalog = {
  hero: heroBlock,
  services: servicesBlock,
  reviews: reviewsBlock,
  gallery: galleryBlock,
  contact: contactBlock,
} as const satisfies Record<string, AnyBlockDefinition>;

/** The set of known block type identifiers. */
export type BlockType = keyof typeof blockCatalog;

/** All block definitions, in palette order. */
export const blockList: readonly AnyBlockDefinition[] = [
  heroBlock,
  servicesBlock,
  reviewsBlock,
  galleryBlock,
  contactBlock,
];

/** Narrow an arbitrary string to a known block type. */
export function isKnownBlockType(type: string): type is BlockType {
  return Object.prototype.hasOwnProperty.call(blockCatalog, type);
}

/** Look up a block definition by type, or `undefined` if the type is unknown. */
export function getBlockDefinition(type: string): AnyBlockDefinition | undefined {
  return isKnownBlockType(type) ? blockCatalog[type] : undefined;
}
