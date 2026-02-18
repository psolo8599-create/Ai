import "./globals.css";

export const metadata = {
  title: "XTROM AI • Red Coding Debugger",
  description: "XTROM AI - AI Multifungsi Fokus Coding, Debugging, dan Analisis Screenshot"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}