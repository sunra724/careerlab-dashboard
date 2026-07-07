import { NextResponse } from "next/server";

import { getOverviewData } from "@/lib/overview";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getOverviewData());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "개요 데이터를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
