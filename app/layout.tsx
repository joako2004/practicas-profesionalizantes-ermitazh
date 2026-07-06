import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cabañas Ermitazh",
  description:
    "Descanso y naturaleza en nuestras cabañas — el escape perfecto en la provincia de Buenos Aires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <meta name="color-scheme" content="light" />
      <body className="min-h-dvh flex flex-col antialiased selection:bg-toasted-brown/20">
        {children}
      </body>
    </html>
  );
}
