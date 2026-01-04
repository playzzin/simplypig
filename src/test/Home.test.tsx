import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Home } from '@/Home'

describe('Home', () => {
  it('renders title', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Welcome to Modern React App')).toBeInTheDocument()
  })
})
