import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bloom Studio Dashboard",
  description: "AI-powered business dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
