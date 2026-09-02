import "./globals.css";

export const metadata = {
  title: "Estoque Cozinha - IFPE Belo Jardim",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
