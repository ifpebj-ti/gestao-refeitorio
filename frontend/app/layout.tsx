import "./globals.css";

export const metadata = {
  title: "Estoque Cozinha - IFPE Belo Jardim",
  description: "Sistema de Controle de Estoque e Consumo do Refeitório",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}