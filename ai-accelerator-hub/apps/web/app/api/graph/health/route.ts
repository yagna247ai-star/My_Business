/**
 * Graph health (bug audit M2). Public, so it returns status only: no driver errors, credentials,
 * hostnames or tenant names. 503 when configured but unreachable, so monitors see the outage.
 */
import { isNeo4jEnabled, neo4jStatus, runCypher } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isNeo4jEnabled()) return NextResponse.json({ status: "disabled", mode: "prisma-only" });
  if (neo4jStatus() === "down") return NextResponse.json({ status: "unavailable", mode: "prisma-only" }, { status: 503 });
  try {
    const res = await runCypher<{ levels: number }>(`MATCH (l:Level) RETURN count(l) AS levels`);
    if (!res) return NextResponse.json({ status: "unavailable", mode: "prisma-only" }, { status: 503 });
    return NextResponse.json({ status: "ok", levels: Number(res.records[0]?.levels ?? 0) });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
