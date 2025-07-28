import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { OrdersTable } from "./-components/orders-table";
export const Route = createFileRoute("/_dashboard/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div>
      <h1> Welcome {privateData.data?.user.name}</h1>
      <OrdersTable />
    </div>
  );
}
