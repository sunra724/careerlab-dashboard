"use client";

import { useState } from "react";
import { Camera, Trash2, ZoomIn } from "lucide-react";
import useSWR from "swr";

import PhotoLightbox from "@/components/photos/PhotoLightbox";
import PhotoUploader from "@/components/photos/PhotoUploader";
import { fetchJson } from "@/lib/fetcher";
import type { SessionPhotoRecord } from "@/lib/types";

export default function PhotoGallery({
  sessionType,
  sessionId,
  sessionTitle,
}: {
  sessionType: "workshop" | "activity";
  sessionId: number;
  sessionTitle?: string;
}) {
  const [lightboxId, setLightboxId] = useState<number | null>(null);
  const { data, mutate } = useSWR<SessionPhotoRecord[]>(
    `/api/photos?session_type=${sessionType}&session_id=${sessionId}`,
    (url: string) => fetchJson<SessionPhotoRecord[]>(url),
  );

  const photos = data ?? [];
  const currentIndex = photos.findIndex((photo) => photo.id === lightboxId);
  const currentPhoto = currentIndex >= 0 ? photos[currentIndex] : null;

  async function handleDelete(id: number) {
    if (!window.confirm("이 사진을 삭제할까요?")) {
      return;
    }

    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setLightboxId((prev) => (prev === id ? null : prev));
    await mutate();
  }

  async function handleCaptionSave(id: number, caption: string) {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
    await mutate();
  }

  return (
    <div>
      <PhotoUploader
        onUploaded={() => void mutate()}
        sessionId={sessionId}
        sessionType={sessionType}
      />

      {photos.length > 0 ? (
        <>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Camera className="h-3.5 w-3.5" />
            사진 {photos.length}장
            {sessionTitle ? <span className="text-slate-400">· {sessionTitle}</span> : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <div
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                key={photo.id}
              >
                <img
                  alt={photo.caption ?? photo.original_name ?? "세션 사진"}
                  className="h-full w-full cursor-pointer object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                  onClick={() => setLightboxId(photo.id)}
                  src={photo.url}
                />
                <button
                  className="absolute left-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => setLightboxId(photo.id)}
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
                <button
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/85 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                  onClick={() => void handleDelete(photo.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {photo.caption ? (
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
                    <p className="truncate text-[10px] text-white">{photo.caption}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
          아직 업로드된 사진이 없습니다.
        </div>
      )}

      {currentPhoto ? (
        <PhotoLightbox
          current={currentPhoto}
          hasNext={currentIndex < photos.length - 1}
          hasPrevious={currentIndex > 0}
          onCaptionSave={(caption) => handleCaptionSave(currentPhoto.id, caption)}
          onClose={() => setLightboxId(null)}
          onDelete={() => handleDelete(currentPhoto.id)}
          onNext={() => setLightboxId(photos[currentIndex + 1]?.id ?? currentPhoto.id)}
          onPrevious={() => setLightboxId(photos[currentIndex - 1]?.id ?? currentPhoto.id)}
        />
      ) : null}
    </div>
  );
}
