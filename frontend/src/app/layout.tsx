import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Import our new Provider
import Provider from "./Provider"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zapier Clone",
  description: "Automate your work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the children! */}
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}