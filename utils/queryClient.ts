import { QueryClient } from '@tanstack/react-query'

let queryClientInstance: QueryClient | null = null

export const queryClientUtils = {
  getQueryClient: (): QueryClient => {
    if (!queryClientInstance) {
      queryClientInstance = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
    }
    return queryClientInstance
  },
}

export const QueryClientKey = {
  CART: ['cart'] as const,
  VENUE: ['venue'] as const,
}
