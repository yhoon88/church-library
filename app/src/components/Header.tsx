"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./client";

/** 회원 화면 상단 바 */
export function MemberHeader({ name }: { name?: string | null }) {
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }
  return (
    <header className="sticky top-0 z-30 border-b border-paper-strong bg-paper-base/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between gap-3 px-4">
        <Link href="/books" className="font-heading text-[22px] text-ink">
          교회 도서실
        </Link>
        <div className="flex items-center gap-4">
          {name && <span className="max-w-[9rem] truncate text-[16px] text-ink-2">{name}님</span>}
          <button type="button" onClick={logout} className="text-[16px] font-semibold text-ink underline underline-offset-4">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

/** 관리자 화면 상단 바 */
export function AdminHeader({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    router.replace("/");
  }
  return (
    <header className="sticky top-0 z-30 border-b border-paper-strong bg-paper-base/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4">
        <Link href="/admin" className="font-heading text-[22px] text-ink">
          교회 도서실
        </Link>
        {showLogout && (
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-primary px-3 py-1 text-[15px] font-semibold text-white">관리자</span>
            <button type="button" onClick={logout} className="text-[16px] font-semibold text-ink underline underline-offset-4">
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/** 로그인한 회원 정보. 없으면 / 로 보냄 */
export function useMember() {
  const router = useRouter();
  const [member, setMember] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    let alive = true;
    api<{ member: { id: string; name: string } | null }>("/api/me").then((r) => {
      if (!alive) return;
      if (r.status === 401 || (r.ok && !r.data.member)) router.replace("/");
      else if (r.ok) setMember(r.data.member);
    });
    return () => {
      alive = false;
    };
  }, [router]);
  return member;
}

/** 관리자 여부: null=확인 중 */
export function useAdmin() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const check = () => {
    setFailed(false);
    api<{ admin: boolean }>("/api/admin/me").then((r) => {
      if (r.ok) setAdmin(!!r.data.admin);
      else if (r.status === 401) setAdmin(false);
      else setFailed(true);
    });
  };
  useEffect(check, []);
  return { admin, setAdmin, failed, recheck: check };
}
