import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MicroShop - Modern Microservices E-Commerce",
  description: "A dynamic microservices e-commerce application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <Navbar />
          <main className="container py-8">
            {children}
          </main>
          {/* <Footer /> */}
        </AppProvider>
      </body>
    </html>
  );
}
