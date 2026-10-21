import { useEffect } from 'react'
import { getCategory, getProduct } from './data/catalog'
import { bilingual, pick, useCopy, useLocale } from './i18n'
import { catalogFor } from './i18n/catalog'
import { StoreProvider, useStore, type Route } from './store'
import { TryOnProvider } from './components/tryon/TryOnProvider'
import SmoothScroll from './components/SmoothScroll'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import BackToTop from './components/BackToTop'
import Splash from './components/splash/Splash'
import PageTransition from './components/transition/PageTransition'
import LanguageVeil from './components/transition/LanguageVeil'
import LanguageNotice from './components/locale/LanguageNotice'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Atelier from './pages/Atelier'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import Account from './pages/Account'
import GiftCards from './pages/GiftCards'
import Cart from './pages/Cart'

// The site-wide English title and description come from .figma/make/site.json (read from the og tags, which never
// change); the French ones are here, as Shopify's Translate & Adapt would hold them.
const SITE = bilingual(
  {
    title: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? document.title,
    description: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    chapterMissing: 'Chapter not found',
    pieceMissing: 'Piece not found',
    wishlist: 'Wishlist',
    giftcards: 'Gift Cards',
    account: 'Your Account',
    cart: 'Your Bag',
    checkout: 'Checkout',
    atelier: 'The Atelier',
    skip: 'Skip to content',
  },
  {
    title: 'Teresa & Sons — Joaillerie fine à Montréal depuis 1962',
    description: 'Une maison familiale de joaillerie fine, rue Sherbrooke Ouest depuis 1962 : diamants certifiés GIA, mariage, bijoux d’or à transmettre et location, sertis à la main à Montréal.',
    chapterMissing: 'Chapitre introuvable',
    pieceMissing: 'Pièce introuvable',
    wishlist: 'Liste de souhaits',
    giftcards: 'Cartes-cadeaux',
    account: 'Votre compte',
    cart: 'Votre panier',
    checkout: 'Paiement',
    atelier: 'L’Atelier',
    skip: 'Passer au contenu',
  },
)

/** Tab title and meta description for a route, in the visitor's language, so every page names itself in tabs,
 *  history and bookmarks. */
function headFor(route: Route): [string, string] {
  const t = pick(SITE)
  const catalog = catalogFor()
  const named = (name: string, description = t.description): [string, string] => [`${name} — Teresa & Sons`, description]
  switch (route.name) {
    case 'category': {
      const category = getCategory(route.slug)
      return category ? named(catalog.category(category).name, catalog.category(category).description) : named(t.chapterMissing)
    }
    case 'product': {
      const product = getProduct(route.slug)
      const copy = product && catalog.product(product)
      return copy ? named(copy.name, `${copy.tagline} ${copy.description}`) : named(t.pieceMissing)
    }
    case 'wishlist': return named(t.wishlist)
    case 'giftcards': return named(t.giftcards)
    case 'account': return named(t.account)
    case 'cart': return named(t.cart)
    case 'checkout': return named(t.checkout)
    case 'atelier': return named(t.atelier)
    default: return [t.title, t.description]
  }
}

/** The page for a route. It renders the route PageTransition is showing, which trails the address during a transition. */
function Routes({ route }: { route: Route }) {
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

/** The pages, with Barba-style transitions between them. The tab title follows the address at once. */
function Pages() {
  const { route } = useStore()
  const { locale } = useLocale()
  useEffect(() => {
    const [title, description] = headFor(route)
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', locale.replace('-', '_'))
  }, [route, locale])
  return <PageTransition>{(shown) => <Routes route={shown} />}</PageTransition>
}

/** Keyboard users jump past the header. A `#main` link would be read as a route, so focus moves in code. */
function skipToContent() {
  document.querySelector<HTMLElement>('main')?.focus()
}

function SkipLink() {
  const t = useCopy(SITE)
  return (
    <button
      type="button"
      onClick={skipToContent}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:bg-[var(--text-espresso)] focus:px-5 focus:py-3 focus:text-[11px] focus:font-medium focus:uppercase focus:tracking-[0.22em] focus:text-[var(--bg-travertine)] focus:outline focus:outline-offset-2 focus:outline-[var(--gold-vermeil)]"
    >
      {t.skip}
    </button>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <TryOnProvider>
      <SmoothScroll>
        <div className="min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]">
          <SkipLink />
          <Splash />
          <Header />
          <main tabIndex={-1} className="outline-none">
            <Pages />
          </main>
          <Footer />
          <CartDrawer />
          <BackToTop />
          <LanguageNotice />
          <LanguageVeil />
          <div className="film-grain" aria-hidden />
        </div>
      </SmoothScroll>
      </TryOnProvider>
    </StoreProvider>
  )
}
