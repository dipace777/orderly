import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/food-menu')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/food-menu"!</div>
}
