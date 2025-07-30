import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DayView } from "./-components/day-view";
export const Route = createFileRoute("/_dashboard/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div>
      <DayView />
    </div>
  );
}
