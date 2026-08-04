import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  blockCatalog,
  blockList,
  getBlockDefinition,
  isKnownBlockType,
} from "@/blocks";

/**
 * Proves the catalog is usable at runtime: every block renders to static HTML with its default
 * props without throwing. This is the same path the Step 6 server renderer will take.
 */

describe("block catalog", () => {
  it("exposes all five v1 blocks", () => {
    expect(blockList.map((b) => b.type).sort()).toEqual(
      ["contact", "gallery", "hero", "reviews", "services"].sort(),
    );
  });

  it("resolves known types and rejects unknown ones", () => {
    expect(isKnownBlockType("hero")).toBe(true);
    expect(isKnownBlockType("nope")).toBe(false);
    expect(getBlockDefinition("hero")?.type).toBe("hero");
    expect(getBlockDefinition("nope")).toBeUndefined();
  });

  it("gives every block a stable type, label, and default props", () => {
    for (const def of blockList) {
      expect(def.type).toBeTruthy();
      expect(def.label).toBeTruthy();
      expect(def.defaultProps).toBeTypeOf("object");
    }
  });

  it.each(Object.values(blockCatalog).map((d) => [d.type, d] as const))(
    "renders %s to static markup with its default props",
    (_type, def) => {
      const html = renderToStaticMarkup(<def.Component {...def.defaultProps} />);
      expect(html.length).toBeGreaterThan(0);
    },
  );

  it("renders the hero headline into the markup", () => {
    const hero = getBlockDefinition("hero");
    expect(hero).toBeDefined();
    if (!hero) return;
    const html = renderToStaticMarkup(<hero.Component {...hero.defaultProps} />);
    expect(html).toContain("<h1");
  });

  it("renders the contact form with accessible fields", () => {
    const contact = getBlockDefinition("contact");
    expect(contact).toBeDefined();
    if (!contact) return;
    const html = renderToStaticMarkup(<contact.Component {...contact.defaultProps} />);
    expect(html).toContain('name="email"');
    expect(html).toContain("<label");
  });
});
