
import "./globals.css";

export const metadata = { title: "Liga Hub" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui" }}>
        <header style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
          <strong>Esports MVP</strong>
          <span style={{ fontSize: 12, opacity: .6 }}>Next.js 16 + Flask</span>
        </header>
        {children}
      </body>
    </html>
  );
}
