export function Loading({ title = 'Loading...' }: { title?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  )
}
