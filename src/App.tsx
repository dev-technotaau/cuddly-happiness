import { useEffect } from 'react'
import { getCategory, getProduct } from './data/catalog'
import { StoreProvider, useStore, type Route } from './store'
import { TryOnProvider } from './components/tryon/TryOnProvider'
import SmoothScroll from './components/SmoothScroll'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import BackToTop from './components/BackToTop'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Atelier from './pages/Atelier'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import Account from './pages/Account'
import GiftCards from './pages/GiftCards'
import Cart from './pages/Cart'

// The site-wide title and description come from .figma/make/site.json (read from the og tags, which never change).
const SITE_TITLE = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? document.title
const SITE_DESCRIPTION = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? ''

/** Tab title and meta description for a route, so every page names itself in tabs, history and bookmarks. */
function headFor(route: Route): [string, string] {
  const named = (name: string, description = SITE_DESCRIPTION): [string, string] => [`${name} — Teresa & Sons`, description]
  switch (route.name) {
    case 'category': {
      const category = getCategory(route.slug)
      return category ? named(category.name, category.description) : named('Chapter not found')
    }
    case 'product': {
      const product = getProduct(route.slug)
      return product ? named(product.name, `${product.tagline} ${product.description}`) : named('Piece not found')
    }
    case 'wishlist': return named('Wishlist')
    case 'giftcards': return named('Gift Cards')
    case 'account': return named('Your Account')
    case 'cart': return named('Your Bag')
    case 'checkout': return named('Checkout')
    case 'atelier': return named('The Atelier')
    default: return [SITE_TITLE, SITE_DESCRIPTION]
  }
}

function Routes() {
  const { route } = useStore()
  useEffect(() => {
    const [title, description] = headFor(route)
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [route])
  switch (route.name) {
    case 'category':
      return <Category key={route.slug} slug={route.slug} />
    case 'product':
      return <Product key={route.slug} slug={route.slug} />
    case 'wishlist':
      return <Wishlist />
    case 'giftcards':
      return <GiftCards />
    case 'account':
      return <Account />
    case 'cart':
      return <Cart />
    case 'checkout':
      return <Checkout />
    case 'atelier':
      return <Atelier />
    default:
      return <Home />
  }
}

/** Keyboard users jump past the header. A `#main` link would be read as a route, so focus moves in code. */
function skipToContent() {
  document.querySelector<HTMLElement>('main')?.focus()
}

export default function App() {
  return (
    <StoreProvider>
      <TryOnProvider>
      <SmoothScroll>
        <div className="min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]">
          <button
            type="button"
            onClick={skipToContent}
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:bg-[var(--text-espresso)] focus:px-5 focus:py-3 focus:text-[11px] focus:font-medium focus:uppercase focus:tracking-[0.22em] focus:text-[var(--bg-travertine)] focus:outline focus:outline-offset-2 focus:outline-[var(--gold-vermeil)]"
          >
            Skip to content
          </button>
          <Header />
          <main tabIndex={-1} className="outline-none">
            <Routes />
          </main>
          <Footer />
          <CartDrawer />
          <BackToTop />
          <div className="film-grain" aria-hidden />
        </div>
      </SmoothScroll>
      </TryOnProvider>
    </StoreProvider>
  )
}
