import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/project/$projectId/settings"!</div>
}
