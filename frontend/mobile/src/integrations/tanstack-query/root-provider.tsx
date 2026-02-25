/* eslint-disable react-refresh/only-export-components */
import { tokenStore } from '@/lib/request'
import { routeTree } from '@/routeTree.gen'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { AxiosError } from 'axios'

type TransitionDirection = 'forward' | 'back'

const getPathDepth = (pathname: string) => {
  if (pathname === '/') return 0
  return pathname.split('/').filter(Boolean).length
}

const isListPath = (pathname: string) => pathname.startsWith('/list/')
const isHotelDetailPath = (pathname: string) => pathname.startsWith('/hotel/')

const inferDirectionByRouteRelation = (
  fromPathname?: string,
  toPathname?: string,
): TransitionDirection | undefined => {
  if (!fromPathname || !toPathname || fromPathname === toPathname)
    return undefined

  if (fromPathname === '/address-search' && toPathname === '/') return 'back'
  if (isListPath(fromPathname) && toPathname === '/') return 'back'
  if (isHotelDetailPath(fromPathname) && isListPath(toPathname)) return 'back'

  if (isListPath(fromPathname) && isHotelDetailPath(toPathname))
    return 'forward'

  const fromDepth = getPathDepth(fromPathname)
  const toDepth = getPathDepth(toPathname)

  if (toDepth > fromDepth) return 'forward'
  if (toDepth < fromDepth) return 'back'

  return undefined
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            // toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          tokenStore.remove()
        }
        // if (error.response?.status === 500) {
        //   router.navigate({ to: '/500' })
        // }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultViewTransition: {
    types: ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged) return false

      const relationDirection = inferDirectionByRouteRelation(
        fromLocation?.pathname,
        toLocation.pathname,
      )
      if (relationDirection) {
        return ['page-slide', relationDirection]
      }

      const fromIndex = (
        fromLocation?.state as { __TSR_index?: number } | undefined
      )?.__TSR_index
      const toIndex = (toLocation.state as { __TSR_index?: number } | undefined)
        ?.__TSR_index

      if (
        typeof fromIndex === 'number' &&
        typeof toIndex === 'number' &&
        toIndex < fromIndex
      ) {
        return ['page-slide', 'back']
      }

      return ['page-slide', 'forward']
    },
  },
})

export const redirectForAuth = () => {
  const redirect = `${router.history.location.href}`
  router.navigate({ to: '/login', search: { redirect } })
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
