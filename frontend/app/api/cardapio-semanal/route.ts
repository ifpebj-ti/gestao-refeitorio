import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), ".cardapio-data");
const DATA_FILE = path.join(DATA_DIR, "cardapio-semanal.json");

// Cache em memória compartilhado entre todas as requisições do servidor
let cacheCardapio: any = null;

function carregarDoDisco() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const conteudo = fs.readFileSync(DATA_FILE, "utf-8");
      cacheCardapio = JSON.parse(conteudo);
    }
  } catch (e) {
    console.error("Erro ao ler cardápio do disco:", e);
  }
}

function salvarNoDisco(dados: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf-8");
  } catch (e) {
    console.error("Erro ao salvar cardápio no disco:", e);
  }
}

export async function GET() {
  if (!cacheCardapio) {
    carregarDoDisco();
  }
  return NextResponse.json(cacheCardapio || null, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    cacheCardapio = body;
    salvarNoDisco(body);
    return NextResponse.json({ sucesso: true }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message || "Erro ao salvar" }, { status: 400 });
  }
}
