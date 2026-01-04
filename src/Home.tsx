import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { UserForm } from '@/components/UserForm'
import { usePosts } from '@/hooks/usePosts'
import { useAppStore } from '@/stores/useAppStore'

export function Home() {
  const { data: posts, isLoading, error, refetch } = usePosts()
  const user = useAppStore((state) => state.user)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Welcome to Modern React App</h1>
        <Button onClick={toggleTheme} variant="outline">
          {theme === 'light' ? 'Dark' : 'Light'}
        </Button>
      </div>
      
      <p className="text-lg text-muted-foreground">
        A modern React application with Vite, TypeScript, and Tailwind CSS
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">User Information</h2>
          {user ? (
            <div className="p-4 bg-muted rounded-lg">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {user.age && <p><strong>Age:</strong> {user.age}</p>}
              {user.bio && <p><strong>Bio:</strong> {user.bio}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground">No user information available</p>
          )}
          <UserForm />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Posts from API</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load posts"
              description={error instanceof Error ? error.message : 'Unknown error'}
              onRetry={() => refetch()}
            />
          ) : posts ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.slice(0, 5).map((post) => (
                <div key={post.id} className="p-3 border rounded-lg">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">Vite</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">⚛️</div>
            <div className="font-semibold">React</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">📘</div>
            <div className="font-semibold">TypeScript</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">🎨</div>
            <div className="font-semibold">Tailwind CSS</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">🧭</div>
            <div className="font-semibold">TanStack Router</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-semibold">TanStack Query</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">🗄️</div>
            <div className="font-semibold">Zustand</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold">React Hook Form</div>
          </div>
        </div>
      </div>
    </div>
  )
}
