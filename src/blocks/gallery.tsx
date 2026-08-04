import type { ReactNode } from "react";
import { defineBlock } from "./types";

/**
 * Gallery — a responsive grid of job photos. Every image requires alt text for accessibility;
 * captions are optional.
 */

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export type GalleryProps = {
  title?: string;
  images: GalleryImage[];
};

function Gallery(props: GalleryProps): ReactNode {
  const { title } = props;
  const images = props.images ?? [];

  return (
    <section id="gallery" className="bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {title ? (
          <h2 className="mb-10 font-heading text-3xl font-bold tracking-tight">{title}</h2>
        ) : null}

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <figure className="flex flex-col gap-2">
                <div className="aspect-[4/3] overflow-hidden rounded-token bg-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimization is wired in a later step */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                {image.caption ? (
                  <figcaption className="text-sm text-muted">{image.caption}</figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const galleryBlock = defineBlock<GalleryProps>({
  type: "gallery",
  label: "Gallery",
  description: "A responsive grid of job photos with required alt text and optional captions.",
  category: "media",
  defaultProps: {
    title: "Recent work",
    images: [
      { url: "https://placehold.co/800x600?text=Project+1", alt: "A completed project" },
      { url: "https://placehold.co/800x600?text=Project+2", alt: "A completed project" },
      { url: "https://placehold.co/800x600?text=Project+3", alt: "A completed project" },
    ],
  },
  Component: Gallery,
});
