"use client";

import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { BookStatus } from "./client";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`ms ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variantCls: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-black disabled:bg-ink-muted",
  secondary: "bg-paper-strong text-ink hover:bg-[#e3dfd0] disabled:text-ink-muted",
  danger: "bg-late text-white hover:opacity-90 disabled:opacity-50",
  ghost: "bg-transparent text-ink-2 underline underline-offset-4",
};

export function btnClass(variant: Variant = "primary", extra = "") {
  return `inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-[17px] transition-colors disabled:cursor-not-allowed ${variantCls[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...rest} className={btnClass(variant, className)} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={btnClass(variant, className)}>
      {children}
    </Link>
  );
}

export function SmallButton({
  variant = "secondary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-1 min-h-[44px] px-4 rounded-lg font-semibold text-[16px] transition-colors disabled:cursor-not-allowed ${variantCls[variant]} ${className}`}
    />
  );
}

export function StatusBadge({ status }: { status: BookStatus }) {
  if (status === "available") return <Badge tone="ok">대출 가능</Badge>;
  if (status === "overdue") return <Badge tone="late">연체</Badge>;
  return <Badge tone="loan">대출 중</Badge>;
}

export function Badge({ tone, children }: { tone: "ok" | "loan" | "late"; children: ReactNode }) {
  const cls =
    tone === "ok" ? "bg-ok-bg text-ok" : tone === "late" ? "bg-late-bg text-late" : "bg-loan-bg text-loan";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[15px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full min-h-[56px] rounded-xl border border-paper-strong bg-white px-4 text-[18px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[16px] font-semibold text-ink-2">{label}</span>
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-[16px] font-medium text-late">
      {children}
    </p>
  );
}

export function InfoText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-[16px] font-medium text-ok">
      {children}
    </p>
  );
}

/** 빈 상태 / 오류 / 로딩 안내 상자 */
export function StateBox({
  text,
  onRetry,
  action,
}: {
  text: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-paper-surface px-5 py-10 text-center">
      <p className="text-[17px] text-ink-2">{text}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
      {action}
    </div>
  );
}

export function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[88px] animate-pulse rounded-xl bg-paper-strong" />
      ))}
    </div>
  );
}

export function ConfirmModal({
  open,
  message,
  confirmText = "확인",
  cancelText = "취소",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-paper-base p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-heading mb-6 text-center text-[20px] text-ink">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>
            {cancelText}
          </Button>
          <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={onConfirm} disabled={busy}>
            {busy ? "처리 중…" : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-2xl bg-paper-base p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto w-full px-4 pb-16 pt-5 ${wide ? "max-w-[1100px]" : "max-w-[760px]"}`}>{children}</main>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-5 text-[26px] leading-tight text-ink">{children}</h1>;
}
