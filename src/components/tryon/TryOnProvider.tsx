import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { tryOnKind, type Metal, type Product } from '../../data/catalog'

const TryOnStudio = lazy(() => import('./TryOnStudio'))

export interface TryOnRequest {
  product: Product
  metal?: Metal
  text?: string
  /** Pieces offered in the "try another" rail. */
  list?: Product[]
}

interface Ctx {
  openTryOn: (req: TryOnRequest) => void
  canTryOn: (p: Product) => boolean
}

const TryOnContext = createContext<Ctx | null>(null)

export function TryOnProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<TryOnRequest | null>(null)
  const canTryOn = useCallback((p: Product) => tryOnKind(p) !== null, [])
  const openTryOn = useCallback((r: TryOnRequest) => {
    if (tryOnKind(r.product)) setReq(r)
  }, [])
  const value = useMemo(() => ({ openTryOn, canTryOn }), [openTryOn, canTryOn])

  return (
    <TryOnContext.Provider value={value}>
      {children}
      {req && (
        <Suspense fallback={null}>
          <TryOnStudio request={req} onClose={() => setReq(null)} />
        </Suspense>
      )}
    </TryOnContext.Provider>
  )
}

export function useTryOn() {
  const ctx = useContext(TryOnContext)
  if (!ctx) throw new Error('useTryOn must be used inside TryOnProvider')
  return ctx
}
