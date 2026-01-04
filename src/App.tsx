import { RouterProvider } from '@tanstack/react-router'
import router from './router'
import { useAppStore } from './stores/useAppStore'

function App() {
  const theme = useAppStore((state) => state.theme)
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : 'light'}`}>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
