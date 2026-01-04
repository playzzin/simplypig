import { Outlet, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function Root() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-4">
            <Link to="/" className="font-bold text-xl">
              Modern React App
            </Link>
            <div className="flex space-x-2">
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost">About</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
