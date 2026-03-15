import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Musicify — Spotify to Apple Music",
  description: "Transfer your playlists and liked songs from Spotify to Apple Music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" async />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
