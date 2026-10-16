import { StoreProvider, useStore } from './store'
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

function Routes() {
  const { route } = useStore()
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
