import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MPLADS Sentinel AI",
  description: "Executive Intelligence and Monitoring Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <TopNav />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}