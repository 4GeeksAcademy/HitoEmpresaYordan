import type { Metadata } from "next";
import { InventoryProducts } from "@/src/components/inventory-products";

export const metadata: Metadata = {
  title: "Inventario | Nexova Backoffice",
};

export default function InventoryProductsPage() {
  return <InventoryProducts />;
}
