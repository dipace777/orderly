import { createFileRoute } from "@tanstack/react-router";
import { OrdersView } from "./-components/order-view";

export const Route = createFileRoute("/_dashboard/orders")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <OrdersView />
    </div>
  );
}
