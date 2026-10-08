"use client";

export type BookStatus = "available" | "loaned" | "overdue";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  status: BookStatus;
  due_date: string | null;
  mine: boolean;
  loan_id: string | null;
};

export type Loan = {
  id: string;
  book_id: string;
  book_title: string;
  book_author: string | null;
  book_publisher: string | null;
  member_id: string;
  member_name: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  overdue: boolean;
  photo_url: string | null;
};

export type ApiResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

/** fetch JSON. Network error → status 0. */
export async function api<T = Record<string, unknown>>(
  url: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
    let data: unknown = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { ok: res.ok, status: res.status, data: (data ?? {}) as T & { error?: string } };
  } catch {
    return { ok: false, status: 0, data: {} as T & { error?: string } };
  }
}

/** 이미지 파일을 최대 1280px JPEG(q0.8)로 줄인다 */
export async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 사진 업로드 → path 또는 null(실패) */
export async function uploadPhoto(file: File): Promise<string | null> {
  try {
    const blob = await compressImage(file);
    const fd = new FormData();
    fd.append("file", blob, "photo.jpg");
    const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
    if (!res.ok) return null;
    const j = (await res.json()) as { path?: string };
    return j.path ?? null;
  } catch {
    return null;
  }
}
