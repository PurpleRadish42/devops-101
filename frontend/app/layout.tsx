import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevOps 101",
  description: "Docker Compose, CI/CD and Kubernetes teaching demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
