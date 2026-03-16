import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

import { getFilePath } from "@/lib/upload";

export const dynamic = "force-dynamic";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export async function GET(
  _: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const safeFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "");

    if (!safeFilename) {
      return NextResponse.json({ error: "invalid filename" }, { status: 400 });
    }

    const filePath = getFilePath(safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const extension = safeFilename.split(".").pop()?.toLowerCase() ?? "jpg";
    const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": MIME_BY_EXTENSION[extension] ?? "image/jpeg",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "파일을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
