import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { tryOnKind, type Metal, type Product } from '../../data/catalog'
import type { BandMetal } from '../../data/ring'

const TryOnStudio = lazy(() => import('./TryOnStudio'))

/** A ring from the designer, tried on as designed: its code (the 3D ring is built from it), its picture from above (for
 *  the rail, and the flat try-on where 3D can't run), its name and price, and the ways back to the designer. */
export interface TryOnDesign {
  image: string
  title: string
  price: number
  code: string
  size: string | null
  /** Back to the designer's size step (the studio closes first). */
  onSize?: () => void
  /** Another metal chosen while trying it on: the designer takes it too. */
  onMetal?: (metal: BandMetal) => void
}

export interface TryOnRequest {
  /** The catalog piece; for a design, the commission it rides on. */
  product: Product
  metal?: Metal
  text?: string
  /** Pieces offered in the "try another" rail. */
  list?: Product[]
  design?: TryOnDesign
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
    if (r.design || tryOnKind(r.product)) setReq(r)
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
