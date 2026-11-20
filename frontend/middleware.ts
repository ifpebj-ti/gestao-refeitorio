import { NextRequest, NextResponse } from "next/server";

export const ROTAS_PUBLICAS = ["/", "/login", "/tv", "/tv/refeitorio"];

export const PREFIXOS_ROTAS_PROTEGIDAS = [
  "/usuarios",
  "/admin",
  "/estoque",
  "/cardapio",
  "/cardapio-tv",
  "/relatorios",
  "/consumo",
  "/alertas",
  "/notas",
];

export function isRotaProtegida(pathname: string): boolean {
  if (ROTAS_PUBLICAS.includes(pathname) || pathname.startsWith("/tv/")) {
    return false;
  }
  return PREFIXOS_ROTAS_PROTEGIDAS.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isRotaProtegida(pathname)) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("token")?.value;
  const authSessionCookie = request.cookies.get("auth_session")?.value;

  if (!tokenCookie && !authSessionCookie) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/usuarios/:path*",
    "/admin/:path*",
    "/estoque/:path*",
    "/cardapio/:path*",
    "/cardapio-tv/:path*",
    "/relatorios/:path*",
    "/consumo/:path*",
    "/alertas/:path*",
    "/notas/:path*",
  ],
};
