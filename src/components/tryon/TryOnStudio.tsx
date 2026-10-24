import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Download,
  FlipHorizontal2,
  Hand,
  ImageUp,
  Move,
  RefreshCw,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  SwitchCamera,
  X,
} from 'lucide-react'
import { METALS, PRODUCTS, priceFor, quickAddable, rentFirst, tryOnKind, type Metal, type Product, type TryOnKind } from '../../data/catalog'
import { BAND_METALS, PRESETS, decodeDesign, designCode, patch, type BandMetal, type RingDesign } from '../../data/ring'
import { RING_COPY } from '../../data/ringCopy'
import { DEPOSIT_SHARE, designDeposit, ringPrice } from '../../data/ringPrice'
import { purposeFor } from '../../data/visits'
import { bilingual, formatNumber, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import type { LightPreset } from '../designer/three/lighting'
import { getLenis } from '../SmoothScroll'
import Price from '../Price'
import { FINGERS, type FingerId } from './fingerPose'
import canDraw3d from '../designer/canDraw3d'
import JewelryOverlay from './JewelryOverlay'
import type { RingTryOnApi, TrackState } from './RingTryOn'
import type { TryOnRequest } from './TryOnProvider'

// The 3D try-on (three.js and the hand tracker) loads only when a ring is tried on in 3D.
const RingTryOn = lazy(() => import('./RingTryOn'))

interface Placement {
  x: number // % of stage width
  y: number // % of stage height
  scale: number
  rotate: number // degrees
  spread: number // earrings only
}

// Starting positions tuned for a selfie framed head-and-shoulders, or a hand held up to the lens.
const DEFAULTS: Record<TryOnKind, Placement & { width: number }> = {
  necklace: { x: 50, y: 70, scale: 1, rotate: 0, spread: 0.5, width: 0.62 },
  earrings: { x: 50, y: 46, scale: 1, rotate: 0, spread: 0.55, width: 0.62 },
  ring: { x: 50, y: 52, scale: 1, rotate: 0, spread: 0.5, width: 0.42 },
  bracelet: { x: 50, y: 55, scale: 1, rotate: 0, spread: 0.5, width: 0.55 },
  watch: { x: 50, y: 52, scale: 1, rotate: 90, spread: 0.5, width: 0.4 },
}

type Light = LightPreset | 'auto'
const LIGHTS: Exclude<Light, 'gallery'>[] = ['auto', 'studio', 'daylight', 'salon', 'candle']

type KindCopy = { name: string; guide: string; tip: string }

const COPY = bilingual(
  {
    kinds: {
      necklace: { name: 'Necklace', guide: 'Frame your face and shoulders', tip: 'Drag the chain to your collarbone.' },
      earrings: { name: 'Earrings', guide: 'Face the camera, hair tucked back', tip: 'Align each stone with your earlobes using Spacing.' },
      ring: { name: 'Ring', guide: 'Hold your hand flat, back to the lens', tip: 'Drag the band onto your ring finger and rotate to match.' },
      bracelet: { name: 'Bracelet', guide: 'Show your wrist to the camera', tip: 'Drag onto your wrist and rotate to follow your arm.' },
      watch: { name: 'Watch', guide: 'Show the top of your wrist', tip: 'Rotate so the strap runs along your arm.' },
    } as Record<TryOnKind, KindCopy>,
    dialog: (name: string) => `View ${name} on you`,
    yourPhoto: 'Your photo',
    title: 'View it <em>on you</em>',
    denied: 'Camera access was declined. You can allow it in your browser settings, or use a photo instead.',
    unsupported: 'Your browser does not support camera access here. Upload a photo to try the piece on.',
    waiting: 'Waiting for camera permission…',
    private: (guide: string) => `${guide}. Your camera feed stays on this device.`,
    retry: 'Try camera again',
    start: 'Start camera',
    upload: 'Upload a photo',
    close: 'Close try-on',
    switchCamera: 'Switch camera',
    mirror: 'Mirror image',
    guideToggle: 'Toggle positioning guide',
    reset: 'Reset position',
    another: 'Choose another photo',
    take: 'Take photo',
    yourTryOn: 'Your try-on',
    retake: 'Retake',
    save: 'Save photo',
    eyebrow: (kind: string) => `View on you · ${kind}`,
    metal: (name: string) => `Metal — ${name}`,
    sliders: { scale: 'Size', rotate: 'Rotation', spread: 'Spacing' },
    nudge: { left: 'Nudge left', right: 'Nudge right', up: 'Nudge up', down: 'Nudge down' },
    dates: 'Choose dates',
    personalize: 'Personalize this piece',
    options: 'Choose size & options',
    inPerson: 'See it in person — book a visit',
    tryAnother: 'Try another',
    tryThis: (name: string) => `Try ${name}`,
    privacy: 'Processed entirely on your device. Nothing is recorded or uploaded. The rendering is an illustration — proportions are approximate.',
    yourDesign: 'Your design',
    chooseSize: 'Choose your size',
    designInPerson: 'Book a design consultation',
    ar: {
      badge: 'Live 3D',
      preparing: 'Preparing the 3D try-on…',
      loading: 'Preparing hand tracking…',
      looking: 'Show the back of your hand',
      stuck: 'Still no hand? Try “Place it by hand”',
      far: 'Bring your hand a little closer',
      near: 'Hold your hand a little further from the lens',
      palm: 'Turn your hand: the back toward the lens',
      edge: 'Move your hand toward the centre',
      on: (finger: string) => `On your ${finger}`,
      photoNone: 'No hand found: place it by hand',
      placing: 'Drag the ring onto your finger',
      failed: 'Tracking unavailable: place it by hand',
      placingTip: 'Drag the ring onto your finger; pinch or use the sliders to size and turn it.',
      tip: 'The ring finds your finger and follows your hand, in 3D.',
      finger: 'Finger',
      fingers: { index: 'Index', middle: 'Middle', ring: 'Ring', little: 'Little' } as Record<FingerId, string>,
      fingerNames: { index: 'index finger', middle: 'middle finger', ring: 'ring finger', little: 'little finger' } as Record<FingerId, string>,
      fit: 'Fit on the finger',
      light: 'Light',
      lights: { auto: 'Match the room', studio: 'Studio', daylight: 'Daylight', salon: 'Salon lamps', candle: 'Candlelight' } as Record<Exclude<Light, 'gallery'>, string>,
      byHand: 'Place it by hand',
      privacy: 'Your hand is tracked on this device with Google’s MediaPipe, downloaded when you start. Neither what the camera sees nor any photo you add leaves the device. The ring is drawn in 3D from its design — an illustration, its proportions approximate.',
    },
  },
  {
    kinds: {
      necklace: { name: 'Collier', guide: 'Cadrez votre visage et vos épaules', tip: 'Glissez la chaîne jusqu’à votre clavicule.' },
      earrings: { name: 'Boucles d’oreilles', guide: 'Face à la caméra, cheveux dégagés', tip: 'Alignez chaque pierre sur vos lobes avec l’écartement.' },
      ring: { name: 'Bague', guide: 'Tenez la main à plat, le dos vers l’objectif', tip: 'Glissez l’anneau sur votre annulaire et faites-le pivoter.' },
      bracelet: { name: 'Bracelet', guide: 'Montrez votre poignet à la caméra', tip: 'Glissez-le sur votre poignet et faites-le pivoter dans l’axe du bras.' },
      watch: { name: 'Montre', guide: 'Montrez le dessus de votre poignet', tip: 'Faites pivoter pour que le bracelet suive votre bras.' },
    },
    dialog: (name) => `Essayer ${name} sur vous`,
    yourPhoto: 'Votre photo',
    title: 'Essayez-la <em>sur vous</em>',
    denied: 'L’accès à la caméra a été refusé. Vous pouvez l’autoriser dans les réglages de votre navigateur, ou utiliser une photo.',
    unsupported: 'Votre navigateur ne permet pas l’accès à la caméra ici. Téléversez une photo pour essayer la pièce.',
    waiting: 'En attente de l’autorisation de la caméra…',
    private: (guide) => `${guide}. Le flux de votre caméra reste sur cet appareil.`,
    retry: 'Réessayer la caméra',
    start: 'Activer la caméra',
    upload: 'Téléverser une photo',
    close: 'Fermer l’essayage',
    switchCamera: 'Changer de caméra',
    mirror: 'Image miroir',
    guideToggle: 'Afficher ou masquer le guide',
    reset: 'Réinitialiser la position',
    another: 'Choisir une autre photo',
    take: 'Prendre une photo',
    yourTryOn: 'Votre essayage',
    retake: 'Reprendre',
    save: 'Enregistrer la photo',
    eyebrow: (kind) => `Essayage · ${kind}`,
    metal: (name) => `Métal — ${name}`,
    sliders: { scale: 'Taille', rotate: 'Rotation', spread: 'Écartement' },
    nudge: { left: 'Déplacer vers la gauche', right: 'Déplacer vers la droite', up: 'Déplacer vers le haut', down: 'Déplacer vers le bas' },
    dates: 'Choisir les dates',
    personalize: 'Personnaliser cette pièce',
    options: 'Choisir la taille et les options',
    inPerson: 'La voir en personne — prendre rendez-vous',
    tryAnother: 'Essayer une autre pièce',
    tryThis: (name) => `Essayer ${name}`,
    privacy: 'Traité entièrement sur votre appareil. Rien n’est enregistré ni téléversé. Le rendu est une illustration — les proportions sont approximatives.',
    yourDesign: 'Votre création',
    chooseSize: 'Choisir votre taille',
    designInPerson: 'Réserver une consultation création',
    ar: {
      badge: '3D en direct',
      preparing: 'Préparation de l’essayage en 3D…',
      loading: 'Préparation du suivi de la main…',
      looking: 'Montrez le dos de votre main',
      stuck: 'Toujours pas de main? Essayez « La placer à la main »',
      far: 'Rapprochez un peu votre main',
      near: 'Éloignez un peu votre main de l’objectif',
      palm: 'Tournez la main : le dos vers l’objectif',
      edge: 'Ramenez votre main vers le centre',
      on: (finger) => `Sur votre ${finger}`,
      // A word joiner keeps « placez-la » on one line.
      photoNone: 'Aucune main repérée : placez-\u2060la à la main',
      placing: 'Glissez la bague sur votre doigt',
      failed: 'Suivi indisponible : placez-\u2060la à la main',
      placingTip: 'Glissez la bague sur votre doigt; pincez ou utilisez les curseurs pour l’ajuster et la tourner.',
      tip: 'La bague trouve votre doigt et suit votre main, en 3D.',
      finger: 'Doigt',
      fingers: { index: 'Index', middle: 'Majeur', ring: 'Annulaire', little: 'Auriculaire' },
      fingerNames: { index: 'index', middle: 'majeur', ring: 'annulaire', little: 'auriculaire' },
      fit: 'Ajustement au doigt',
      light: 'Lumière',
      lights: { auto: 'Ambiante', studio: 'Studio', daylight: 'Lumière du jour', salon: 'Lampes du salon', candle: 'Lueur de chandelle' },
      byHand: 'La placer à la main',
      privacy: 'Votre main est suivie sur cet appareil avec MediaPipe de Google, téléchargé au démarrage. Ni ce que voit la caméra ni les photos que vous ajoutez ne quittent l’appareil. La bague est dessinée en 3D d’après sa création — une illustration, aux proportions approximatives.',
    },
  },
)

type Source = 'idle' | 'requesting' | 'camera' | 'photo' | 'denied' | 'unsupported'

export default function TryOnStudio({ request, onClose }: { request: TryOnRequest; onClose: () => void }) {
  const { currency, addToCart, openVisit } = useStore()
  const t = useCopy(COPY)
  const r = useCopy(RING_COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const [product, setProduct] = useState<Product>(request.product)
  // A ring from the designer is tried on as designed until another piece is chosen; its metal can change here.
  const design = request.design
  const [mine, setMine] = useState(!!design)
  const [tried, setTried] = useState<RingDesign | null>(() => (design ? decodeDesign(design.code) : null))
  const kind: TryOnKind = mine ? 'ring' : (tryOnKind(product) as TryOnKind)
  const [metal, setMetal] = useState<Metal | undefined>(request.metal ?? product.metals[0])
  const [place, setPlace] = useState<Placement>(() => ({ ...DEFAULTS[kind] }))
  const [source, setSource] = useState<Source>('idle')
  const [facing, setFacing] = useState<'user' | 'environment'>(kind === 'ring' || kind === 'bracelet' || kind === 'watch' ? 'environment' : 'user')
  const [mirror, setMirror] = useState(true)
  const [guide, setGuide] = useState(true)
  const [photo, setPhoto] = useState<string | null>(null)
  const [shot, setShot] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  // The 3D try-on: the finger, how the ring sits on it, the light, placing it by hand, and what the tracker sees.
  const [finger, setFinger] = useState<FingerId>('ring')
  const [fit, setFit] = useState(1)
  const [light, setLight] = useState<Light>('auto')
  const [manual, setManual] = useState(false)
  const [track, setTrack] = useState<TrackState | null>(null)
  const [webgl] = useState(canDraw3d)
  // A 3D view the browser takes back (its graphics reset) hands over to the flat try-on for the rest of the visit.
  const [lost, setLost] = useState(false)
  const [stuck, setStuck] = useState(false)

  const stage = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const still = useRef<HTMLImageElement | null>(null)
  // The pictures as elements too, so the 3D try-on hears when one appears.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [stillEl, setStillEl] = useState<HTMLImageElement | null>(null)
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    video.current = el
    setVideoEl(el)
  }, [])
  const stillRef = useCallback((el: HTMLImageElement | null) => {
    still.current = el
    setStillEl(el)
  }, [])
  const overlay = useRef<SVGSVGElement>(null)
  const ringApi = useRef<RingTryOnApi | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; angle: number; scale: number; rotate: number } | null>(null)

  const swatch = metal ? METALS[metal].swatch : '#D4B982'
  const defaults = DEFAULTS[kind]
  const list = design ? PRODUCTS.filter((p) => tryOnKind(p) === 'ring' && p.slug !== request.product.slug) : (request.list ?? PRODUCTS).filter((p) => tryOnKind(p) !== null)
  const needsConfig = !quickAddable(product)
  const name = mine && design ? design.title : catalog.name(product)
  // A design's price comes from its code (with any metal chosen here), like the bag's, in the market on screen.
  const designPrice = tried ? ringPrice(tried, currency) : design?.price ?? 0

  // The ring in 3D: the design as tried, or a house ring the designer builds (in the metal chosen here).
  const ring3d = useMemo<RingDesign | null>(() => {
    if (!webgl || lost) return null
    if (mine) return tried
    const preset = PRESETS.find((p) => p.slug === product.slug)
    if (!preset) return null
    return metal && (BAND_METALS as Metal[]).includes(metal) ? patch(preset.design, { metal: { band: metal as BandMetal } }) : preset.design
  }, [webgl, lost, mine, tried, product.slug, metal])
  const ar = !!ring3d
  useEffect(() => {
    if (!ar) setTrack(null)
  }, [ar])
  // Placed by hand: by choice, where tracking can't run, or on a photo without a hand.
  const placing = ar && (manual || track?.phase === 'manual' || (track?.phase === 'photo' && !track.found))
  // Six seconds without a hand: the status points to placing it by hand.
  useEffect(() => {
    setStuck(false)
    if (track?.phase !== 'live' || track.hint !== 'looking') return
    const id = window.setTimeout(() => setStuck(true), 6000)
    return () => window.clearTimeout(id)
  }, [track])

  // Lock page scroll while open.
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }, [])

  const startCamera = useCallback(
    async (mode: 'user' | 'environment') => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setSource('unsupported')
        return
      }
      stopCamera()
      setSource('requesting')
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1600 } }, audio: false })
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => undefined)
        }
        setPhoto(null)
        // Mirrored unless the camera faces away (a laptop's webcam faces the visitor whatever was asked for).
        const real = s.getVideoTracks()[0]?.getSettings().facingMode
        setMirror((real || mode) !== 'environment')
        setSource('camera')
      } catch {
        setSource('denied')
      }
    },
    [stopCamera],
  )

  useEffect(() => stopCamera, [stopCamera])

  // Reset placement when switching to a different kind of piece.
  const choose = (p: Product) => {
    const k = tryOnKind(p) as TryOnKind
    if (k !== kind) setPlace({ ...DEFAULTS[k] })
    setMine(false)
    setProduct(p)
    setMetal(p.metals.includes(metal as Metal) ? metal : p.metals[0])
    setAdded(false)
  }

  const chooseMetal = (m: BandMetal) => {
    if (!tried) return
    setTried(patch(tried, { metal: { band: m } }))
    setAdded(false)
    design?.onMetal?.(m)
  }

  const onUpload = (file?: File) => {
    if (!file) return
    stopCamera()
    const url = URL.createObjectURL(file)
    setPhoto(url)
    setMirror(false)
    setSource('photo')
  }

  // Gestures: drag with one pointer, pinch/rotate with two, wheel to scale. In 3D the hand places the ring, unless it is
  // being placed by hand.
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x), scale: place.scale, rotate: place.rotate }
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev || !stage.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const rect = stage.current.getBoundingClientRect()
    if (pointers.current.size === 1) {
      const dx = ((e.clientX - prev.x) / rect.width) * 100
      const dy = ((e.clientY - prev.y) / rect.height) * 100
      setPlace((p) => ({ ...p, x: Math.min(100, Math.max(0, p.x + dx)), y: Math.min(100, Math.max(0, p.y + dy)) }))
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const g = gesture.current
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      setPlace((p) => ({ ...p, scale: Math.min(3, Math.max(0.3, g.scale * (dist / g.dist))), rotate: g.rotate + ((angle - g.angle) * 180) / Math.PI }))
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current = null
  }
  const onWheel = (e: React.WheelEvent) => setPlace((p) => ({ ...p, scale: Math.min(3, Math.max(0.3, p.scale * (1 - e.deltaY * 0.0012))) }))

  const nudge = (key: keyof Placement, delta: number) => setPlace((p) => ({ ...p, [key]: (p[key] as number) + delta }))

  // Composite the frame (with object-cover crop and mirroring) plus the piece into a PNG.
  const capture = async () => {
    const st = stage.current
    const media = source === 'camera' ? video.current : still.current
    if (!st || !media || (!ar && !overlay.current && !(mine && design))) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const cw = st.clientWidth * dpr
    const ch = st.clientHeight * dpr
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')!
    const mw = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth
    const mh = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight
    const s = Math.max(cw / mw, ch / mh)
    ctx.save()
    if (mirror) {
      ctx.translate(cw, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(media, (cw - mw * s) / 2, (ch - mh * s) / 2, mw * s, mh * s)
    ctx.restore()

    if (ar) {
      // The ring in 3D, as it sits on the hand now, drawn as a still.
      await ringApi.current?.draw(ctx, cw, ch)
    } else {
      // The piece: the designed ring's own picture, or the drawn overlay.
      const img = new Image()
      img.src = mine && design ? design.image : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(overlay.current!))}`
      await img.decode()
      const size = cw * defaults.width * place.scale
      ctx.save()
      ctx.translate((place.x / 100) * cw, (place.y / 100) * ch)
      ctx.rotate((place.rotate * Math.PI) / 180)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    }

    // Discreet maison mark.
    ctx.fillStyle = 'rgba(251,249,245,0.85)'
    ctx.font = `${14 * dpr}px 'Baskervville', serif`
    ctx.fillText('Teresa & Sons · Montréal', 18 * dpr, ch - 18 * dpr)
    setShot(canvas.toDataURL('image/png'))
  }

  const add = () => {
    // A design goes in only with its size; it never falls back to the commission itself.
    if (mine && design) {
      if (!design.size) return
      addToCart({ slug: product.slug, size: design.size, design: tried ? designCode(tried) : design.code })
    } else addToCart({ slug: product.slug, metal })
    setAdded(true)
  }

  const live = source === 'camera' || source === 'photo'
  const steer = live && (!ar || placing)
  const ctrl = 'flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 disabled:opacity-40'
  const pill = (on: boolean) => `py-3 text-[10px] uppercase tracking-[0.14em] ring-1 transition-colors disabled:opacity-40 ${on ? 'bg-[var(--gold-champagne)] text-[var(--bg-vault)] ring-[var(--gold-champagne)]' : 'text-white/80 ring-white/15 hover:ring-white/45'}`
  const pct = (n: number) => formatNumber(n, { style: 'percent', maximumFractionDigits: 0 })

  // What the 3D try-on says about the hand.
  const onFinger = t.ar.on(t.ar.fingerNames[finger])
  // Short enough for a phone's chip; the loading figure is shown but not spoken, so the status speaks once.
  const arStatus = !track ? (
    t.ar.preparing
  ) : track.phase === 'loading' ? (
    <>{t.ar.loading}<span aria-hidden> {pct(track.progress)}</span></>
  ) : track.phase === 'live' ? (
    track.hint === 'looking' ? (stuck ? t.ar.stuck : t.ar.looking) : track.hint === 'ok' ? onFinger : t.ar[track.hint]
  ) : track.phase === 'photo' ? (
    track.found ? onFinger : t.ar.photoNone
  ) : track.phase === 'manual' ? (
    track.reason === 'failed' ? t.ar.failed : t.ar.placing
  ) : null
  // One row of metals: a design's (changed on the hand, the designer takes it too) or the piece's own.
  const metals: Metal[] = mine ? (ar && tried ? BAND_METALS : []) : product.metals.length > 1 && !rentFirst(product) ? product.metals : []
  const shownMetal = mine ? tried?.metal.band : metal
  const onHand = !!track && ((track.phase === 'live' && track.hint !== 'looking') || (track.phase === 'photo' && track.found)) && !manual
  const showGuide = guide && (!ar || (!onHand && !placing))

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)] lg:flex-row" role="dialog" aria-modal="true" aria-label={t.dialog(name)} data-lenis-prevent>
      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 lg:p-8">
        <div
          ref={stage}
          className={`relative aspect-[3/4] h-full max-h-full max-w-full touch-none select-none overflow-hidden bg-black ${steer && ar ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={steer ? onPointerDown : undefined}
          onPointerMove={steer ? onPointerMove : undefined}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={steer ? onWheel : undefined}
        >
          <video ref={videoRef} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${source === 'camera' ? '' : 'hidden'}`} style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
          {photo && <img key={photo} ref={stillRef} src={photo} alt={t.yourPhoto} className={`absolute inset-0 h-full w-full object-cover ${source === 'photo' ? '' : 'hidden'}`} />}

          {live && showGuide && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-6">
              <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full opacity-35" aria-hidden>
                {kind === 'necklace' || kind === 'earrings' ? (
                  <path d="M150 70 C 105 70 92 110 95 150 C 98 195 120 225 150 228 C 180 225 202 195 205 150 C 208 110 195 70 150 70 Z M60 400 C 65 320 100 285 150 280 C 200 285 235 320 240 400" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="5 5" />
                ) : (
                  <path d="M120 380 L 120 250 C 105 230 95 200 100 170 L 110 90 C 112 80 126 80 127 92 L 130 160 L 138 70 C 140 58 156 58 157 72 L 158 160 L 166 80 C 168 68 184 68 184 82 L 182 165 L 196 110 C 199 99 214 101 212 114 L 198 220 C 192 245 182 255 180 270 L 180 380" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="5 5" />
                )}
              </svg>
              {!ar && <p className="font-spec relative rounded-full bg-black/45 px-4 py-2 text-[10px] uppercase tracking-[0.2em] backdrop-blur">{t.kinds[kind].guide}</p>}
            </div>
          )}

          {/* The piece: the ring in 3D on the hand, or the drawn overlay placed by hand */}
          {live && ar && ring3d && (
            <Suspense fallback={null}>
              <RingTryOn design={ring3d} media={source === 'camera' ? videoEl : stillEl} source={source} mirror={mirror} finger={finger} fit={fit} light={light} placed={place} manual={manual} api={ringApi} onState={(s) => (s.phase === 'lost' ? setLost(true) : setTrack(s))} />
            </Suspense>
          )}
          {live && !ar && (
            <div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: `${place.x}%`,
                top: `${place.y}%`,
                width: `${defaults.width * 100}%`,
                aspectRatio: '1',
                transform: `translate(-50%, -50%) rotate(${place.rotate}deg) scale(${place.scale})`,
              }}
            >
              {mine && design ? (
                <img src={design.image} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
              ) : (
                <JewelryOverlay ref={overlay} kind={kind} swatch={swatch} product={product} text={request.product.slug === product.slug ? request.text : undefined} spread={place.spread} />
              )}
            </div>
          )}

          {/* What the 3D try-on sees: loading, the hand found or not, how to hold it */}
          {live && ar && (
            <p role="status" className="font-spec pointer-events-none absolute left-3 top-4 z-10 flex w-max max-w-[calc(100%-5.5rem)] items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-center text-[10px] uppercase leading-snug tracking-[0.16em] text-white backdrop-blur sm:left-1/2 sm:max-w-[66%] sm:-translate-x-1/2">
              {onHand && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold-champagne)] motion-safe:animate-pulse" />}
              {arStatus}
            </p>
          )}

          {/* Pre-start / fallback states */}
          {!live && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#2a2622_0%,#121110_75%)] p-8 text-center">
              <ScanFace size={40} strokeWidth={1} className="text-[var(--gold-champagne)]" />
              <p className="font-spec mt-6 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{ar ? t.ar.badge : 'Essayage virtuel'}</p>
              <h2 className="font-serif-editorial mt-3 text-4xl font-light lg:text-5xl">
                {rich(t.title, 'text-[var(--gold-champagne)]')}
              </h2>
              <p className="mt-4 max-w-xs text-sm text-white/60">
                {source === 'denied' ? t.denied : source === 'unsupported' ? t.unsupported : source === 'requesting' ? t.waiting : ar ? `${t.private(t.kinds.ring.guide)} ${t.ar.tip}` : t.private(t.kinds[kind].guide)}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {source !== 'unsupported' && (
                  <button onClick={() => startCamera(facing)} disabled={source === 'requesting'} className="flex items-center justify-center gap-2 bg-[var(--gold-champagne)] px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--bg-vault)] transition-colors hover:bg-white disabled:opacity-60">
                    <Camera size={15} strokeWidth={1.5} /> {source === 'denied' ? t.retry : t.start}
                  </button>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 border border-white/25 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-[var(--gold-champagne)]">
                  <ImageUp size={15} strokeWidth={1.3} /> {t.upload}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          )}

          {/* Stage controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <button onClick={onClose} aria-label={t.close} className={ctrl}><X size={18} strokeWidth={1.4} /></button>
            {source === 'camera' && (
              <>
                <button onClick={() => { const f = facing === 'user' ? 'environment' : 'user'; setFacing(f); startCamera(f) }} aria-label={t.switchCamera} className={ctrl}><SwitchCamera size={17} strokeWidth={1.4} /></button>
                <button onClick={() => setMirror((m) => !m)} aria-label={t.mirror} aria-pressed={mirror} className={ctrl}><FlipHorizontal2 size={17} strokeWidth={1.4} /></button>
              </>
            )}
            {live && (
              <>
                <button onClick={() => setGuide((g) => !g)} aria-label={t.guideToggle} aria-pressed={guide} className={ctrl}><ScanFace size={17} strokeWidth={1.4} /></button>
                <button onClick={() => { setPlace({ ...defaults }); setFit(1) }} aria-label={t.reset} className={ctrl}><RotateCcw size={17} strokeWidth={1.4} /></button>
              </>
            )}
          </div>

          {live && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
              <p className="font-spec hidden max-w-[50%] items-center gap-2 text-[10px] uppercase leading-relaxed tracking-[0.16em] text-white/75 sm:flex">
                <Move size={13} strokeWidth={1.4} className="shrink-0" /> {ar ? (placing ? t.ar.placingTip : t.ar.tip) : t.kinds[kind].tip}
              </p>
              <div className="flex items-center gap-3">
                {source === 'photo' && (
                  <label className={`${ctrl} cursor-pointer`} aria-label={t.another}>
                    <RefreshCw size={16} strokeWidth={1.4} />
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
                  </label>
                )}
                <button onClick={capture} aria-label={t.take} className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 transition-transform active:scale-95">
                  <span className="h-12 w-12 rounded-full bg-white" />
                </button>
              </div>
            </div>
          )}

          {/* Captured shot */}
          {shot && (
            <div className="absolute inset-0 z-20 flex flex-col bg-black">
              <img src={shot} alt={t.yourTryOn} className="min-h-0 flex-1 object-contain" />
              <div className="flex gap-2 p-3">
                <button onClick={() => setShot(null)} className="flex-1 border border-white/25 py-3 text-[11px] uppercase tracking-[0.2em] hover:border-white">{t.retake}</button>
                <a href={shot} download={`${product.slug}-try-on.png`} className="flex flex-1 items-center justify-center gap-2 bg-[var(--gold-champagne)] py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--bg-vault)] hover:bg-white">
                  <Download size={14} strokeWidth={1.5} /> {t.save}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="max-h-[46vh] shrink-0 overflow-y-auto border-t border-white/10 bg-[var(--bg-vault)] px-6 py-6 lg:max-h-none lg:w-[400px] lg:border-l lg:border-t-0 lg:px-8 lg:py-10" data-lenis-prevent>
        <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.eyebrow(mine ? t.yourDesign : t.kinds[kind].name)}{ar && ` · ${t.ar.badge}`}</p>
        <h3 className="font-serif-editorial mt-3 text-3xl font-light leading-tight lg:text-4xl">{name}</h3>
        <Price amount={mine && design ? designPrice : rentFirst(product) && product.rental ? product.rental.weekend[currency] : priceFor(product, currency, metal)} className="mt-2 block text-sm text-white/80 [&_span]:text-white/60" />
        {mine && design && <p className="mt-1 text-xs leading-relaxed text-white/60"><Price amount={designDeposit(designPrice)} className="text-white/80 [&_span]:hidden" />{r.todayShare(pct(DEPOSIT_SHARE))}<Price amount={designPrice - designDeposit(designPrice)} className="text-white/80 [&_span]:hidden" />{r.onApproval}</p>}

        {metals.length > 0 && (
          <div role="group" aria-label={t.metal(shownMetal ? catalog.metal(shownMetal) : '')} className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t.metal(shownMetal ? catalog.metal(shownMetal) : '')}</p>
            <div className="mt-3 flex gap-2">
              {metals.map((m) => (
                <button key={m} onClick={() => (mine ? chooseMetal(m as BandMetal) : setMetal(m))} aria-label={catalog.metal(m)} aria-pressed={shownMetal === m} className={`h-9 w-9 rounded-full p-1 ring-1 transition ${shownMetal === m ? 'ring-[var(--gold-champagne)]' : 'ring-white/15'}`}>
                  <span className="block h-full w-full rounded-full" style={{ background: `linear-gradient(135deg, ${METALS[m].swatch}, #ffffffaa, ${METALS[m].swatch})` }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* The 3D try-on's controls: the finger, the fit, the light, placing it by hand */}
        {live && ar && (
          <div className="mt-6 space-y-5">
            <div role="group" aria-label={t.ar.finger}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t.ar.finger}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FINGERS.map((f) => <button key={f} type="button" onClick={() => setFinger(f)} disabled={placing} aria-pressed={finger === f} className={`${pill(finger === f)} px-3`}>{t.ar.fingers[f]}</button>)}
              </div>
            </div>
            {/* On when placing by hand for any reason; locked on where there is no hand to follow */}
            <button type="button" role="switch" aria-checked={placing} disabled={placing && !manual} onClick={() => setManual((m) => !m)} className="flex w-full items-center justify-between gap-4 border border-white/15 px-4 py-3 text-left transition-colors hover:border-white/35 disabled:opacity-60 disabled:hover:border-white/15">
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"><Hand size={14} strokeWidth={1.4} /> {t.ar.byHand}</span>
              <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${placing ? 'bg-[var(--gold-champagne)]' : 'bg-white/45'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg-vault)] transition-[left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${placing ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>
            {!placing && (
              <label className="block">
                <span className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">{t.ar.fit}<span className="font-spec">{pct(fit)}</span></span>
                <input type="range" min={0.85} max={1.15} step={0.01} value={fit} onChange={(e) => setFit(Number(e.target.value))} aria-valuetext={pct(fit)} className="mt-2 w-full accent-[var(--gold-champagne)]" />
              </label>
            )}
            <div role="group" aria-label={t.ar.light}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t.ar.light}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LIGHTS.map((l) => <button key={l} type="button" onClick={() => setLight(l)} aria-pressed={light === l} className={`${pill(light === l)} px-3`}>{t.ar.lights[l]}</button>)}
              </div>
            </div>
          </div>
        )}

        {/* Placing by hand: the flat try-on, or the 3D ring where no hand is tracked */}
        {live && (!ar || placing) && (
          <div className="mt-6 space-y-4">
            {([
              ['scale', 0.3, 3, 0.01],
              ['rotate', -180, 180, 1],
              ...(kind === 'earrings' ? [['spread', 0, 1, 0.01] as const] : []),
            ] as const).map(([key, min, max, step]) => (
              <label key={key} className="block">
                <span className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {t.sliders[key]}
                  <span className="font-spec">{key === 'rotate' ? `${Math.round(place.rotate)}°` : pct(key === 'scale' ? place.scale : place.spread)}</span>
                </span>
                <input type="range" min={min} max={max} step={step} value={place[key]} onChange={(e) => setPlace((p) => ({ ...p, [key]: Number(e.target.value) }))} className="mt-2 w-full accent-[var(--gold-champagne)]" />
              </label>
            ))}
            <div className="flex gap-2">
              {([['←', 'x', -1, 'left'], ['→', 'x', 1, 'right'], ['↑', 'y', -1, 'up'], ['↓', 'y', 1, 'down']] as const).map(([l, k, d, way]) => (
                <button key={l} onClick={() => nudge(k, d)} aria-label={t.nudge[way]} className="font-spec flex-1 border border-white/15 py-2 text-xs hover:border-white/40">{l}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-2">
          {mine && design ? (
            <>
              {design.size ? (
                <button onClick={add} className="w-full bg-[var(--gold-champagne)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">
                  {added ? common.addedToBag : common.addToBag}
                </button>
              ) : (
                <button type="button" onClick={() => { onClose(); design.onSize?.() }} className="w-full bg-[var(--gold-champagne)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">
                  {t.chooseSize}
                </button>
              )}
              <button type="button" onClick={() => { onClose(); openVisit({ purpose: 'design', pieces: [{ slug: product.slug, size: design.size ?? undefined, design: tried ? designCode(tried) : design.code }] }) }} className="block w-full border border-white/20 py-3.5 text-center text-[10px] uppercase tracking-[0.22em] hover:border-[var(--gold-champagne)]">
                {t.designInPerson}
              </button>
            </>
          ) : needsConfig ? (
            <a href={href.product(product.slug)} onClick={onClose} className="block w-full bg-[var(--gold-champagne)] py-4 text-center text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">
              {rentFirst(product) ? t.dates : product.personalization ? t.personalize : t.options}
            </a>
          ) : (
            <button onClick={add} className="w-full bg-[var(--gold-champagne)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">
              {added ? common.addedToBag : common.addToBag}
            </button>
          )}
          {!mine && (
            <button type="button" onClick={() => { onClose(); openVisit({ purpose: purposeFor(product, rentFirst(product)), pieces: [{ slug: product.slug, metal, rent: rentFirst(product) || undefined }] }) }} className="block w-full border border-white/20 py-3.5 text-center text-[10px] uppercase tracking-[0.22em] hover:border-[var(--gold-champagne)]">
              {t.inPerson}
            </button>
          )}
        </div>

        {list.length > 1 && (
          <div className="mt-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t.tryAnother}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {design && (
                <button onClick={() => { setMine(true); setProduct(request.product); setPlace({ ...DEFAULTS.ring }); setAdded(false) }} aria-label={t.tryThis(design.title)} aria-pressed={mine} className={`aspect-square overflow-hidden bg-[var(--bg-silk)] ring-1 transition ${mine ? 'ring-[var(--gold-champagne)]' : 'opacity-60 ring-white/10 hover:opacity-100'}`}>
                  <img src={design.image} alt="" className="h-full w-full object-contain p-1" />
                </button>
              )}
              {list.slice(0, design ? 11 : 12).map((p) => (
                <button key={p.id} onClick={() => choose(p)} aria-label={t.tryThis(catalog.name(p))} className={`aspect-square overflow-hidden ring-1 transition ${!mine && p.slug === product.slug ? 'ring-[var(--gold-champagne)]' : 'opacity-60 ring-white/10 hover:opacity-100'}`}>
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-white/45">
          <ShieldCheck size={14} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-champagne)]" />
          {ar ? t.ar.privacy : t.privacy}
        </p>
      </aside>
    </div>
  )
}
