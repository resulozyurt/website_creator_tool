import type { ReactNode } from "react";
import { defineBlock } from "./types";

/**
 * Services — a titled grid of the services a business offers. Each card is a service with an
 * optional icon and description.
 */

interface ServiceItem {
  title: string;
  description?: string;
  iconUrl?: string;
}

export type ServicesProps = {
  title: string;
  subtitle?: string;
  items: ServiceItem[];
};

function Services(props: ServicesProps): ReactNode {
  const { title, subtitle } = props;
  const items = props.items ?? [];

  return (
    <section id="services" className="bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="max-w-prose text-muted">{subtitle}</p> : null}
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="flex flex-col gap-3 rounded-token border border-ink/10 p-6"
            >
              {item.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- next/image optimization is wired in a later step
                <img
                  src={item.iconUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 object-contain"
                />
              ) : null}
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              {item.description ? (
                <p className="text-sm text-muted">{item.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const servicesBlock = defineBlock<ServicesProps>({
  type: "services",
  label: "Services",
  description: "A grid of the services you offer, each with an optional icon and description.",
  category: "content",
  defaultProps: {
    title: "What we do",
    subtitle: "Full-service care from a team you can count on.",
    items: [
      { title: "Repairs", description: "Fast, dependable fixes for problems big and small." },
      { title: "Installation", description: "Professional setup done to code and built to last." },
      { title: "Maintenance", description: "Routine tune-ups that keep everything running." },
    ],
  },
  Component: Services,
});
