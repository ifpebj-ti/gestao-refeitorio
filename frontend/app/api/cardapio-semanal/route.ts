import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), ".cardapio-data");
const DATA_FILE = path.join(DATA_DIR, "cardapio-semanal.json");

let cacheCardapio: unknown = null;

function carregarDoDisco() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const conteudo = fs.readFileSync(DATA_FILE, "utf-8");
      cacheCardapio = JSON.parse(conteudo);
    }
  } catch {
    // Falha silenciosa sem expor detalhes internos do sistema de arquivos
  }
}

function salvarNoDisco(dados: unknown) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf-8");
  } catch {
    // Falha silenciosa sem expor detalhes internos
  }
}

export async function GET() {
  if (!cacheCardapio) {
    carregarDoDisco();
  }
  return NextResponse.json(cacheCardapio || null, {
    headers: {
      "Cache-Control": "no-store, max-age=0, s-maxage=0",
    },
  });
}

export async function POST(request: NextRequest) {
  const possuiAuthHeader = Boolean(request.headers.get("authorization"));
  const possuiCookieSessao =
    Boolean(request.cookies.get("token")?.value) ||
    Boolean(request.cookies.get("auth_session")?.value);

  if (!possuiAuthHeader && !possuiCookieSessao) {
    return NextResponse.json(
      { mensagem: "Autenticação necessária" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  try {
    const body = await request.json();
    cacheCardapio = body;
    salvarNoDisco(body);
    return NextResponse.json(
      { sucesso: true },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, s-maxage=0",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { mensagem: "Requisição inválida" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
