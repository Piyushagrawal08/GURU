import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "GURU · an AI master",
  description:
    "Save links, repos, PDFs, images and notes for your AI learning journey — all in one calm, searchable place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="aurora" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
