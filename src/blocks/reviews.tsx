import type { ReactNode } from "react";
import { defineBlock } from "./types";

/**
 * Reviews — social proof from customers. Each item is a quote with an author, optional
 * location, and an optional 1–5 star rating rendered accessibly.
 */

interface ReviewItem {
  author: string;
  quote: string;
  location?: string;
  rating?: number;
}

export type ReviewsProps = {
  title: string;
  items: ReviewItem[];
};

const MAX_STARS = 5;

function clampRating(rating: number | undefined): number | null {
  if (typeof rating !== "number" || Number.isNaN(rating)) return null;
  return Math.max(0, Math.min(MAX_STARS, Math.round(rating)));
}

function StarRating({ rating }: { rating: number }): ReactNode {
  return (
    <div
      className="flex gap-0.5 text-brand"
      role="img"
      aria-label={`Rated ${rating} out of ${MAX_STARS} stars`}
    >
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function Reviews(props: ReviewsProps): ReactNode {
  const { title } = props;
  const items = props.items ?? [];

  return (
    <section id="reviews" className="bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const rating = clampRating(item.rating);
            return (
              <li key={`${item.author}-${index}`} className="rounded-token border border-ink/10 p-6">
                <figure className="flex h-full flex-col gap-4">
                  {rating !== null ? <StarRating rating={rating} /> : null}
                  <blockquote className="text-ink">
                    <p className="text-base leading-relaxed">“{item.quote}”</p>
                  </blockquote>
                  <figcaption className="mt-auto text-sm text-muted">
                    <span className="font-medium text-ink">{item.author}</span>
                    {item.location ? <span> · {item.location}</span> : null}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export const reviewsBlock = defineBlock<ReviewsProps>({
  type: "reviews",
  label: "Reviews",
  description: "Customer testimonials with author, location, and an optional star rating.",
  category: "social-proof",
  defaultProps: {
    title: "What our customers say",
    items: [
      {
        author: "Jamie R.",
        location: "Oak Park",
        rating: 5,
        quote: "Showed up on time, explained everything, and the work was spotless. Highly recommend.",
      },
      {
        author: "Priya S.",
        location: "Riverside",
        rating: 5,
        quote: "Fair price and great communication from start to finish. I'll be a repeat customer.",
      },
      {
        author: "Marcus T.",
        location: "Downtown",
        rating: 4,
        quote: "Solved a problem two other companies couldn't. Professional and friendly.",
      },
    ],
  },
  Component: Reviews,
});
