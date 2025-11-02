import type { Metadata } from "next";
<<<<<<< HEAD
import { PT_Sans, Playfair_Display } from "next/font/google";
=======
import { PT_Sans, Manrope } from "next/font/google";
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/contexts/app-context";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

<<<<<<< HEAD
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
=======
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
  variable: "--font-headline",
});


export const metadata: Metadata = {
<<<<<<< HEAD
  title: "iBarangay - Community Management",
  description: "Modernizing Community Management. Efficiently. Effectively.",
  icons: {
    icon: "/icon.png", // Specifies the primary icon
    shortcut: "/favicon.ico", // Provides a fallback
  },
=======
  title: "iBarangay: Digital Barangay Management",
  description: "A web-based Barangay Information and Service Automation System.",
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
};

export default function RootLayout({
  children,
<<<<<<< HEAD
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased", ptSans.variable, playfairDisplay.variable)}>
=======
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased", ptSans.variable, manrope.variable)}>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
