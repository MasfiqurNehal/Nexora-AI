import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora AI",
  description: "A modern AI workspace for chat, research, and document intelligence."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
