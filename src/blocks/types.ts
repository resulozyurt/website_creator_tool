import type { ReactNode } from "react";

/**
 * Block catalog contract.
 *
 * A "block" is one self-contained, presentational section of a tenant page (hero, services,
 * reviews, …). Each block is defined once and consumed in two places:
 *   - the runtime renderer (Step 6) turns stored block JSON into HTML, and
 *   - the visual editor (Step 7, Puck) lets tenants add and edit blocks.
 *
 * Blocks are pure and take props only — no data fetching, no side effects — so the same
 * component renders identically on the server, in static generation, and inside the editor.
 * The definition here is intentionally editor-agnostic (it does not import Puck); Step 7 maps
 * these definitions onto Puck's field config.
 */

/** Props for any block. Loose by design: block content is stored as JSON and read back untyped. */
export type BlockProps = Record<string, unknown>;

/** Palette grouping for the editor. */
export type BlockCategory = "content" | "social-proof" | "media" | "conversion";

export interface BlockDefinition<P extends BlockProps = BlockProps> {
  /** Stable identifier persisted in block JSON. Never rename without a migration. */
  readonly type: string;
  /** Human-readable name shown in the editor palette. */
  readonly label: string;
  /** One-line description of what the block is for (editor help text). */
  readonly description: string;
  /** Palette grouping. */
  readonly category: BlockCategory;
  /** Values used when a tenant first drops the block onto a page. */
  readonly defaultProps: P;
  /** The presentational component. Pure; renders from props alone. */
  readonly Component: (props: P) => ReactNode;
}

/** A block definition with its props erased — the shape stored in the heterogeneous catalog. */
export type AnyBlockDefinition = BlockDefinition<BlockProps>;

/**
 * A single node in a page's block tree, as stored in JSON. The renderer (Step 6) looks up
 * `type` in the catalog and passes `props` to the matching component.
 */
export interface BlockNode {
  readonly type: string;
  readonly props?: BlockProps;
}

/**
 * Define a block with full prop typing, then erase the prop type at the catalog boundary.
 *
 * A typed `Component: (props: P) => ReactNode` is not assignable to `(props: BlockProps) =>
 * ReactNode` (function-parameter contravariance), so the erasure is done here, once, behind a
 * single documented cast — keeping every call site and the catalog fully `any`-free.
 */
export function defineBlock<P extends BlockProps>(definition: BlockDefinition<P>): AnyBlockDefinition {
  return definition as unknown as AnyBlockDefinition;
}
