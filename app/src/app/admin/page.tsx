"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/components/AdminGate";
import LoansTab from "@/components/admin/LoansTab";
import BooksTab from "@/components/admin/BooksTab";
import MembersTab from "@/components/admin/MembersTab";

type Tab = "loans" | "books" | "members";
const TABS: { key: Tab; label: string }[] = [
  { key: "loans", label: "대출 현황" },
  { key: "books", label: "도서 관리" },
  { key: "members", label: "회원 관리" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("loans");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "books" || t === "members" || t === "loans") setTab(t);
  }, []);

  function choose(t: Tab) {
    setTab(t);
    const url = t === "loans" ? "/admin" : `/admin?tab=${t}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <AdminGate>
      {(kick) => (
        <>
          <nav className="mb-6 grid grid-cols-3 border-b border-paper-strong" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => choose(t.key)}
                className={`min-h-[52px] border-b-[3px] text-[17px] font-semibold transition-colors ${
                  tab === t.key ? "border-primary text-ink" : "border-transparent text-ink-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {tab === "loans" && <LoansTab kick={kick} />}
          {tab === "books" && <BooksTab kick={kick} />}
          {tab === "members" && <MembersTab kick={kick} />}
        </>
      )}
    </AdminGate>
  );
}
