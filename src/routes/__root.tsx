import { createRootRoute } from '@tanstack/react-router'
import { Root } from '@/Root'
import { RouteError } from '@/RouteError'
import { RoutePending } from '@/RoutePending'

export const Route = createRootRoute({
  component: Root,
  errorComponent: RouteError,
  pendingComponent: RoutePending,
})
