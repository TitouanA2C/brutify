import type { Metadata } from "next";
import { Anton, Montserrat } from "next/font/google";
import { UserProvider } from "@/hooks/useUser";
import { SWRProvider } from "@/lib/swr-config";
import { ToastProvider } from "@/lib/toast-context";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brutify",
  description: "Brutify — La plateforme des créateurs qui dominent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${anton.variable} ${montserrat.variable} font-body antialiased bg-brutify-bg text-brutify-text-primary`}
      >
        <SWRProvider>
          <UserProvider>
            <ToastProvider>{children}</ToastProvider>
          </UserProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
