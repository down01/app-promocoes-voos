import { NextResponse } from "next/server";
import { buscarNoMundo } from "@/lib/aeroportos-mundo";

// Sugestões de aeroportos fora da lista principal (qualquer lugar do mundo)
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(buscarNoMundo(q.slice(0, 60)), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
