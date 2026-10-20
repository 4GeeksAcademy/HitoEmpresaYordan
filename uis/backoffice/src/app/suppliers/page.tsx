import type { Metadata } from "next";
import { SupplierDirectory } from "@/src/components/supplier-directory";

export const metadata: Metadata = {
  title: "Proveedores | Nexova Backoffice",
};

export default function SuppliersPage() {
  return <SupplierDirectory />;
}
