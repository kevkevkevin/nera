import type { Metadata } from "next";
import { AdminApp } from "@/components/admin-app";

export const metadata: Metadata = { title: "Admin dashboard | NERA WHOOP Challenge" };

export default function AdminPage() {
  return <AdminApp />;
}
