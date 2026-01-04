import { useRouter } from '@tanstack/react-router'
import { ErrorState } from '@/components/ui/error-state'

export function RouteError({ error }: { error: unknown }) {
  const router = useRouter()

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorState
        title="Page error"
        description={message}
        onRetry={() => router.invalidate()}
      />
    </div>
  )
}
