
import type { Metadata } from "next";

import "./globals.css";
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
      <body className="w-full min-h-screen bg-linear-to-b from-green-50 to-white">
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
