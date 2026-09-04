import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "Coops | CooperativeConnect",
  description: "The all-in-one software powering the future of cooperative services."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
