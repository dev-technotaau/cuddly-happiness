import { StoreProvider, useStore } from './store'
import { TryOnProvider } from './components/tryon/TryOnProvider'
import SmoothScroll from './components/SmoothScroll'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
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

export default function App() {
  return (
    <StoreProvider>
      <TryOnProvider>
      <SmoothScroll>
        <div className="min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]">
          <Header />
          <main>
            <Routes />
          </main>
          <Footer />
          <CartDrawer />
          <div className="film-grain" aria-hidden />
        </div>
      </SmoothScroll>
      </TryOnProvider>
    </StoreProvider>
  )
}
