import "./globals.css";
import "../lib/fontawesome";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthProvider from "../components/AuthProvider";
import AnalyticsTracker from "../components/AnalyticsTracker";
import CookieConsent from "../components/CookieConsent";

export const metadata = {
  title: "Entre Estudiantes",
  description: "Plataforma para estudiantes, ventas, servicios y más",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AnalyticsTracker />
          <Navbar />
          <main>
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
