import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";
import { AppProvider } from "@/context/AppContext";
import { SOPProvider } from "@/context/SOPContext";
import { SettingsProvider } from "@/context/SettingsContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management Dashboard",
  description: "Personal task management with Kanban, Calendar, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SettingsProvider>
            <AppProvider>
              <TaskProvider>
                <SOPProvider>
                  {children}
                </SOPProvider>
              </TaskProvider>
            </AppProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
