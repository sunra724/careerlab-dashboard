"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

export default function PhotoUploader({
  sessionType,
  sessionId,
  onUploaded,
}: {
  sessionType: "workshop" | "activity";
  sessionId: number;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);

  useEffect(() => {
    return () => {
      selectedPhotos.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedPhotos]);

  function resetSelection() {
    selectedPhotos.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedPhotos([]);
    setCaption("");
    setError("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    if (cameraRef.current) {
      cameraRef.current.value = "";
    }
  }

  function applyFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextPhotos: SelectedPhoto[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError("10MB 이하 이미지 파일만 업로드할 수 있습니다.");
        continue;
      }

      nextPhotos.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nextPhotos.length === 0) {
      return;
    }

    selectedPhotos.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedPhotos(nextPhotos);
    setError("");
  }

  function removeSelected(index: number) {
    setSelectedPhotos((prev) => {
      const target = prev[index];

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function handleUpload() {
    if (selectedPhotos.length === 0) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const selected of selectedPhotos) {
        const formData = new FormData();
        formData.append("file", selected.file);
        formData.append("session_type", sessionType);
        formData.append("session_id", String(sessionId));
        formData.append("caption", caption);

        const response = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "사진 업로드에 실패했습니다.");
        }
      }

      resetSelection();
      onUploaded();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "사진 업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  if (selectedPhotos.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => cameraRef.current?.click()} size="sm">
          <Camera className="mr-1 h-4 w-4" />
          촬영
        </Button>
        <Button onClick={() => fileRef.current?.click()} size="sm" variant="outline">
          <ImagePlus className="mr-1 h-4 w-4" />
          앨범 선택
        </Button>
        <input
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => applyFiles(event.target.files)}
          ref={cameraRef}
          type="file"
        />
        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={(event) => applyFiles(event.target.files)}
          ref={fileRef}
          type="file"
        />
        {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {selectedPhotos.map((item, index) => (
          <div
            className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            key={`${item.file.name}-${item.file.lastModified}-${index}`}
          >
            <img
              alt={item.file.name}
              className="h-full w-full object-cover"
              src={item.previewUrl}
            />
            <button
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
              onClick={() => removeSelected(index)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <input
        className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
        maxLength={100}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="사진 설명을 입력하세요. 여러 장 선택 시 동일하게 적용됩니다."
        type="text"
        value={caption}
      />

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="bg-lab-green hover:bg-lab-green/90"
          disabled={uploading}
          onClick={handleUpload}
          size="sm"
        >
          {uploading ? (
            <>
              <span className="mr-2 inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              업로드 중...
            </>
          ) : (
            <>
              <Check className="mr-1 h-4 w-4" />
              {selectedPhotos.length}장 업로드
            </>
          )}
        </Button>
        <Button disabled={uploading} onClick={resetSelection} size="sm" variant="outline">
          선택 취소
        </Button>
      </div>
    </div>
  );
}
