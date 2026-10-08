"use client";

import AdminGate from "@/components/AdminGate";
import BookForm from "@/components/admin/BookForm";

export default function NewBookPage() {
  return <AdminGate wide={false}>{(kick) => <BookForm kick={kick} />}</AdminGate>;
}
