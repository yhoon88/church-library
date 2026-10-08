"use client";

import { useParams } from "next/navigation";
import AdminGate from "@/components/AdminGate";
import BookForm from "@/components/admin/BookForm";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminGate wide={false}>{(kick) => <BookForm id={id} kick={kick} />}</AdminGate>;
}
