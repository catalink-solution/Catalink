import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OrderTrackingPage from "./order-page-client";

export default function OrderPage(props: { params: Promise<{ slug: string; orderId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center py-20 text-center">
          <Loader2 size={40} className="animate-spin text-violet-400" />
          <p className="mt-4 text-white/60">Chargement de ta commande…</p>
        </div>
      }
    >
      <OrderTrackingPage params={props.params} />
    </Suspense>
  );
}
