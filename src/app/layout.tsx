import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { PomodoroProvider } from "@/src/context/PomodoroContext";
import { ThemeProvider } from "@/src/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TodoPro | Productividad Diaria",
  description: "Gestiona tus tareas con UX perfecta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 transition-colors duration-500 ease-in-out dark:bg-slate-950 dark:text-slate-50 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NotificationProvider>
            <PomodoroProvider>
              {children}
            </PomodoroProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}