import type { ReactNode } from "react";
import { defineBlock } from "./types";

/**
 * Hero — the top-of-page banner: headline, supporting line, and up to two calls to action,
 * with an optional supporting image. Rendered as the page's `<h1>`.
 */

interface HeroCta {
  label: string;
  href: string;
}

export type HeroProps = {
  headline: string;
  subheadline?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  imageUrl?: string;
  imageAlt?: string;
};

function Hero(props: HeroProps): ReactNode {
  const { headline, subheadline, primaryCta, secondaryCta, imageUrl, imageAlt } = props;

  return (
    <section className="bg-surface text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="max-w-prose text-lg text-muted">{subheadline}</p>
          ) : null}
          {primaryCta || secondaryCta ? (
            <div className="flex flex-wrap gap-3">
              {primaryCta ? (
                <a
                  href={primaryCta.href}
                  className="inline-flex items-center justify-center rounded-token bg-brand px-5 py-3 font-medium text-brand-foreground transition-opacity hover:opacity-90"
                >
                  {primaryCta.label}
                </a>
              ) : null}
              {secondaryCta ? (
                <a
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-token border border-ink/15 px-5 py-3 font-medium text-ink transition-colors hover:bg-ink/5"
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="overflow-hidden rounded-token">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimization is wired in a later step */}
            <img
              src={imageUrl}
              alt={imageAlt ?? ""}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const heroBlock = defineBlock<HeroProps>({
  type: "hero",
  label: "Hero",
  description: "Top-of-page banner with a headline, intro line, and call-to-action buttons.",
  category: "content",
  defaultProps: {
    headline: "Reliable service, done right the first time",
    subheadline:
      "Licensed, insured, and trusted by homeowners across the area. Book a visit in minutes.",
    primaryCta: { label: "Get a free quote", href: "#contact" },
    secondaryCta: { label: "See our services", href: "#services" },
  },
  Component: Hero,
});
