import type { ReactNode } from "react";
import { defineBlock } from "./types";

/**
 * Contact — business contact details plus an optional request form. The form markup is
 * accessible and server-renderable; its submission is wired to lead creation in Step 10
 * (validation, sanitization, and the FieldPie lead adapter). Until then the form posts to a
 * placeholder endpoint.
 */

export type ContactProps = {
  title: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  showForm?: boolean;
  submitLabel?: string;
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function Contact(props: ContactProps): ReactNode {
  const { title, description, phone, email, address, submitLabel } = props;
  const showForm = props.showForm ?? true;

  return (
    <section id="contact" className="bg-surface text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>
          {description ? <p className="max-w-prose text-muted">{description}</p> : null}

          <dl className="mt-2 flex flex-col gap-3 text-sm">
            {phone ? (
              <div className="flex gap-2">
                <dt className="font-medium">Phone</dt>
                <dd>
                  <a href={telHref(phone)} className="text-brand hover:underline">
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {email ? (
              <div className="flex gap-2">
                <dt className="font-medium">Email</dt>
                <dd>
                  <a href={`mailto:${email}`} className="text-brand hover:underline">
                    {email}
                  </a>
                </dd>
              </div>
            ) : null}
            {address ? (
              <div className="flex gap-2">
                <dt className="font-medium">Address</dt>
                <dd className="text-muted">{address}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {showForm ? (
          <form
            method="post"
            action="#"
            className="flex flex-col gap-4 rounded-token border border-ink/10 p-6"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="contact-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="rounded-token border border-ink/15 px-3 py-2 outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="contact-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-token border border-ink/15 px-3 py-2 outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="contact-phone" className="text-sm font-medium">
                Phone <span className="text-muted">(optional)</span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="rounded-token border border-ink/15 px-3 py-2 outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="contact-message" className="text-sm font-medium">
                How can we help?
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                className="rounded-token border border-ink/15 px-3 py-2 outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-token bg-brand px-5 py-3 font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              {submitLabel ?? "Send request"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export const contactBlock = defineBlock<ContactProps>({
  type: "contact",
  label: "Contact",
  description: "Business contact details and an optional request form that becomes a lead.",
  category: "conversion",
  defaultProps: {
    title: "Get in touch",
    description: "Tell us what you need and we'll get back to you the same day.",
    phone: "(555) 123-4567",
    email: "hello@example.com",
    address: "123 Main St, Your Town",
    showForm: true,
    submitLabel: "Send request",
  },
  Component: Contact,
});
