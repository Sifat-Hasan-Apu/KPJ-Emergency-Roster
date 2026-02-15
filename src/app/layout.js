import { AuthProvider } from "@/context/AuthContext";
import ServiceWorkerRegister from "@/components/common/ServiceWorkerRegister";
import "./globals.css";

export const metadata = {
  title: "Duty Roster Emergency",
  description: "Manage shifts, staff, and analytics",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        <ServiceWorkerRegister />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
