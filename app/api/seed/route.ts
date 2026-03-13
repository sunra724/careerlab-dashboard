import { NextResponse } from "next/server";

import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    seedDatabase();
    return NextResponse.json({
      ok: true,
      message: "시드 데이터 삽입 완료",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "시드 데이터 삽입 실패",
      },
      { status: 500 },
    );
  }
}
