import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/approve-admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/approve-admin"!</div>
}
