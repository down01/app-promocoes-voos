"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Enquanto o robô busca, recarrega os dados da página a cada 8 segundos
export default function AtualizarSozinho({ ativo }: { ativo: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [ativo, router]);
  return null;
}
