import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NERA WHOOP Challenge",
  description: "Join the NERA Wellbeing Week WHOOP Challenge and put your score on the board.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
