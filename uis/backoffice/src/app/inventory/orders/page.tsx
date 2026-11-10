import type { Metadata } from "next";
import { InventoryOrders } from "@/src/components/inventory-orders";

export const metadata: Metadata = {
  title: "Historial de órdenes | Nexova Backoffice",
};

export default function OrdersHistoryPage() {
  return <InventoryOrders />;
}
