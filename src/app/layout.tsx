import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Page from "@/components/Page";
import Main from "@/layouts/Main"
import { Toaster } from 'sonner'
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Azure Maps Sample with NextJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <Page>
          <Toaster expand={true} />
          <Main>
            {children}
          </Main>
        </Page>
      </body>
    </html >
  );
}
