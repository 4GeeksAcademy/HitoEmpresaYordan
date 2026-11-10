import type { Metadata } from "next";
import { InventoryOrderInbound } from "@/src/components/inventory-order-inbound";

export const metadata: Metadata = {
  title: "Registrar entrada | Nexova Backoffice",
};

export default function InboundOrderPage() {
  return <InventoryOrderInbound />;
}
