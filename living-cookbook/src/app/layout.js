import { Poppins, Nunito } from "next/font/google";
import "./globals.css";
import "@/app/themes/pretzelprep.css";
import PretzelNav from "@/components/PretzelNav";
import SiteFooter from "@/components/SiteFooter";
import { HouseholdProvider } from "@/lib/HouseholdContext";

const poppins = Poppins({
  variable: "--pp-font-brand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--pp-font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pretzelprep.com'),
  title: "Pretzel Prep",
  description: "Your recipes. Your kitchen.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no">
      <body className={`${poppins.variable} ${nunito.variable} antialiased`}>
        <HouseholdProvider>
          <PretzelNav />
          <div id="app">
            {children}
          </div>
          <SiteFooter />
        </HouseholdProvider>
      </body>
    </html>
  );
}
