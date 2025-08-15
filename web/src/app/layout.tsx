import SocketProvider from "@/src/components/SocketProvider";
import "./globals.css";

export const metadata = { title: "BasicChatRoom" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}