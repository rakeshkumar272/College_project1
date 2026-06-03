
import type { Metadata } from "next";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";
import GrocyBot from "@/components/GrocyBot";




export const metadata: Metadata = {
  title: "SpeedyMart | 10 minutes grocery Delivery App",
  description: "10 minutes grocery Delivery App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen relative overflow-x-hidden">
        {/* Global Background Layer */}
        <div 
          className="fixed inset-0 -z-10 bg-fixed bg-center bg-cover pointer-events-none"
          style={{ 
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.1), rgba(240, 255, 240, 0.2)), url('/images/grocery_bg.png')",
            opacity: 0.1
          }}
        />
        <Provider>
          <StoreProvider>

            <InitUser />
            <GrocyBot />
            {children}
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
