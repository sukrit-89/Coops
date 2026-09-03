import type { Metadata } from "next";
import "./globals.css";

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
      <body><main>{children}</main></body>
    </html>
  );
}
