"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Edit2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SessionPhotoRecord } from "@/lib/types";

export default function PhotoLightbox({
  current,
  hasNext,
  hasPrevious,
  onCaptionSave,
  onClose,
  onDelete,
  onNext,
  onPrevious,
}: {
  current: SessionPhotoRecord;
  hasNext: boolean;
  hasPrevious: boolean;
  onCaptionSave: (caption: string) => Promise<void>;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(current.caption ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCaption(current.caption ?? "");
    setEditing(false);
  }, [current.caption, current.id]);

  async function handleSave() {
    try {
      setSaving(true);
      await onCaptionSave(caption);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="text-xs text-white/70">
          {current.taken_at?.replace("T", " ").slice(0, 16) ?? ""}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-white/70 hover:text-white" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="text-white/70 hover:text-red-400" onClick={() => void onDelete()}>
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="text-white/70 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <img
          alt={current.caption ?? current.original_name ?? "세션 사진"}
          className="max-h-full max-w-full rounded-2xl object-contain"
          src={current.url}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
          <Button
            className="pointer-events-auto rounded-full"
            disabled={!hasPrevious}
            onClick={onPrevious}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Button>
          <Button
            className="pointer-events-auto rounded-full"
            disabled={!hasNext}
            onClick={onNext}
            size="sm"
            variant="ghost"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 text-center text-white">
        {editing ? (
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <input
              autoFocus
              className="h-10 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-white/40"
              maxLength={100}
              onChange={(event) => setCaption(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSave();
                }
                if (event.key === "Escape") {
                  setEditing(false);
                }
              }}
              placeholder="사진 설명을 입력하세요."
              type="text"
              value={caption}
            />
            <Button disabled={saving} onClick={() => void handleSave()} size="sm">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            className="text-sm text-white/75 hover:text-white"
            onClick={() => setEditing(true)}
          >
            {current.caption ?? "+ 설명 추가"}
          </button>
        )}
      </div>
    </div>
  );
}
