export const metadata = { title: "Esports MVP" };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: "ui-sans-serif,system-ui", margin: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <strong>Esports MVP</strong> — Ligas, jogadores e torneios
        </div>
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}