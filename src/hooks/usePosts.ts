import { useQuery } from '@tanstack/react-query'

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

const fetchPosts = async (): Promise<Post[]> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const usePost = (id: number) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
    enabled: !!id,
  })
}
