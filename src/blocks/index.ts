/**
 * Public surface of the `blocks` module: the block catalog and its contract.
 *
 * The runtime renderer (Step 6) and the editor config (Step 7) both import from here.
 */
export * from "./types";
export * from "./catalog";

export { heroBlock, type HeroProps } from "./hero";
export { servicesBlock, type ServicesProps } from "./services";
export { reviewsBlock, type ReviewsProps } from "./reviews";
export { galleryBlock, type GalleryProps } from "./gallery";
export { contactBlock, type ContactProps } from "./contact";
