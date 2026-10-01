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
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

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
      model: MODEL,
      max_tokens: 4096,
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
          let hasText = false;
          for await (const chunk of stream) {
            if (chunk.type === "message_delta") {
              if (chunk.delta.stop_reason === "refusal") {
                throw new Error("AI가 보고서 생성을 거부했습니다. 입력 내용을 확인해주세요.");
              }
              if (
                chunk.delta.stop_reason === "max_tokens" ||
                chunk.delta.stop_reason === "model_context_window_exceeded"
              ) {
                throw new Error("AI 응답이 길이 제한으로 중단되었습니다. 입력을 줄여 다시 시도해주세요.");
              }
            }
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              hasText ||= chunk.delta.text.trim().length > 0;
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          if (!hasText) {
            throw new Error("AI 응답에 보고서 텍스트가 없습니다.");
          }
          controller.close();
        } catch (error) {
          console.error("Impact streaming failed:", error);
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
    console.error("POST /api/impact/generate failed:", error);
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
