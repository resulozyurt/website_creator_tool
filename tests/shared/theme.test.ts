import { describe, expect, it } from "vitest";
import { themeTokensToStyle } from "@/shared/theme";

/**
 * Theme tokens come from the `sites.theme_tokens` JSON column and are read back untyped, so the
 * mapper must accept arbitrary input and emit only the CSS variables it recognizes.
 */

describe("themeTokensToStyle", () => {
  it("maps known tokens to their CSS variables", () => {
    const style = themeTokensToStyle({ brand: "#ff0000", fontHeading: "Georgia, serif" });
    expect(style).toMatchObject({
      "--color-brand": "#ff0000",
      "--font-heading": "Georgia, serif",
    });
  });

  it("ignores unknown keys and non-string values", () => {
    const style = themeTokensToStyle({
      brand: "#123456",
      notAToken: "nope",
      radius: 12,
      ink: "",
    });
    expect(style).toEqual({ "--color-brand": "#123456" });
  });

  it("returns an empty object for nullish input", () => {
    expect(themeTokensToStyle(null)).toEqual({});
    expect(themeTokensToStyle(undefined)).toEqual({});
  });

  it("covers every documented token key", () => {
    const style = themeTokensToStyle({
      brand: "a",
      brandForeground: "b",
      surface: "c",
      ink: "d",
      muted: "e",
      fontSans: "f",
      fontHeading: "g",
      radius: "h",
    });
    expect(Object.keys(style)).toHaveLength(8);
  });
});
