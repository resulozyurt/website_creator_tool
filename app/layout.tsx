import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldPie Website Builder",
  description: "Multi-tenant website builder for FieldPie customers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
