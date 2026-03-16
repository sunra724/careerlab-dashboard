import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { isAttendanceSessionType } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rawSessionType = request.nextUrl.searchParams.get("session_type") ?? "workshop";
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!isAttendanceSessionType(rawSessionType)) {
      return NextResponse.json({ error: "invalid session_type" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin;
    const attendUrl = `${baseUrl}/attend/${rawSessionType}/${sessionId}`;
    const qr = await QRCode.toDataURL(attendUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#182033",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({ qr, url: attendUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "QR 코드를 생성하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
