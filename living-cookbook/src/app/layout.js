import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "The Living Cookbook",
  description: "A beautiful, intelligent recipe collection.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <div id="app">
          {children}
        </div>
      </body>
    </html>
  );
}
