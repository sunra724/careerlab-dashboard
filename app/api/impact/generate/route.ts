import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import {
  buildImpactUserPrompt,
  IMPACT_SYSTEM_PROMPT,
} from "@/lib/impact-prompts";
import { isImpactSectionKey } from "@/lib/impact-report";
import type { SroiInput } from "@/lib/sroi";
import type { ImpactContextResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GenerateRequestBody {
  context: ImpactContextResponse;
  sroiInput: SroiInput;
  section: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateRequestBody;
    if (!isImpactSectionKey(body.section)) {
      return NextResponse.json(
        { error: "지원하지 않는 보고서 섹션입니다." },
        { status: 400 },
      );
    }

    const client = new Anthropic({ apiKey });
    const stream = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 1800,
      system: IMPACT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildImpactUserPrompt(
            body.context,
            body.sroiInput,
            body.section,
          ),
        },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "영향보고서 생성에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
