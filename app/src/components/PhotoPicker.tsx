"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, SmallButton, btnClass } from "./ui";

/** 책 사진 찍기 (선택). 미리보기 + 다시 찍기 */
export default function PhotoPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f) onChange(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="flex items-center gap-4 rounded-xl bg-paper-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="책 사진 미리보기" className="h-24 w-24 rounded-lg object-cover" />
          <div className="flex flex-col gap-2">
            <SmallButton onClick={() => inputRef.current?.click()}>다시 찍기</SmallButton>
            <SmallButton variant="ghost" onClick={() => onChange(null)}>
              사진 빼기
            </SmallButton>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className={btnClass("secondary", "w-full")}>
          <Icon name="photo_camera" /> 책 사진 찍기 (선택)
        </button>
      )}
    </div>
  );
}
