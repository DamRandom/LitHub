import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "../styles/globals.css";
import { AppProvider } from "@/lib/context";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LitHub - Your Personal Book Manager",
  description:
    "LitHub helps you track, manage, and explore your book collection with ease. Add books from local files, track reading progress, take notes, save quotes, and view beautiful reading statistics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
