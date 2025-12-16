import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});
const zalando = localFont({
  src: "../public/index/ZalandoSansExpanded-VariableFont_wght.ttf",
  variable: "--font-zalando",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoCAM",
  description: "AutoCAM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>
      <body
        className={
          "text-foreground " + zalando.variable + " " + roboto.variable
        }
      >
        {children}
      </body>
    </html>
  );
}
