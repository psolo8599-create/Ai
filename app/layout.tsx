import "./globals.css";

export const metadata = {
  title: "Dardcor AI • Coding Debugger",
  description: "AI Multifungsi Fokus Coding & Debugging"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}