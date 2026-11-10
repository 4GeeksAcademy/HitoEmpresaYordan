import type { Metadata } from "next";
import { InventoryOrderOutbound } from "@/src/components/inventory-order-outbound";

export const metadata: Metadata = {
  title: "Registrar salida | Nexova Backoffice",
};

export default function OutboundOrderPage() {
  return <InventoryOrderOutbound />;
}
