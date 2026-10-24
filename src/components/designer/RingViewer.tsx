import { useEffect, useRef, useState } from 'react'
import { Camera, Layers, Maximize2, Minimize2, Orbit, RotateCw, Sun, X } from 'lucide-react'
import { outlineOf } from '../../data/outline'
import { CUTS, type RingDesign } from '../../data/ring'
import type { StepId } from '../../data/ringAdvice'
import { describeDesign } from '../../data/ringCopy'
import { bilingual, formatNumber, useCopy, useLocale } from '../../i18n'
import { onStageClear } from '../../lib/stage'
import { btnQuiet } from '../ui'
import canDraw3d from './canDraw3d'
import type { LightPreset } from './three/lighting'
import type { PartId } from './three/ringModel'
import type { SetupId } from './three/setups'
import type { Label, LightState, Stage, ViewId } from './three/stage'

const SETUP_IDS: SetupId[] = ['studio', 'salon', 'hand']
const LIGHTS: LightPreset[] = ['studio', 'daylight', 'salon', 'candle', 'gallery']
const VIEWS: ViewId[] = ['hero', 'front', 'side', 'top', 'inside']
const DEFAULT_LIGHT: LightState = { preset: 'studio', exposure: 1, angle: 0, fire: 1 }
// Each light as a small swatch of its room.
const LIGHT_SWATCH: Record<LightPreset, string> = {
  studio: 'linear-gradient(135deg,#ffffff,#9a9a9a 55%,#262626)',
  daylight: 'linear-gradient(135deg,#fffaf2,#c6d3e2 55%,#53606e)',
  salon: 'linear-gradient(135deg,#ffe2bd,#a8743f 55%,#1d140d)',
  candle: 'radial-gradient(circle at 35% 35%,#ffc27a,#6b3a14 45%,#070504 75%)',
  gallery: 'radial-gradient(circle at 40% 30%,#ffffff,#3a3a3a 35%,#030303 70%)',
}

const COPY = bilingual(
  {
    region: '3D view of your ring',
    describe: (title: string) => `${title}, in 3D. Drag to turn it, or use the arrow keys to turn it and + or − to zoom.`,
    loading: 'Preparing the 3D view…',
    setupGroup: 'Where to see it',
    setups: { studio: 'Studio', salon: 'Salon', hand: 'On the hand' } as Record<SetupId, string>,
    light: 'Light',
    lightPanel: 'The light',
    lights: { studio: 'Studio', daylight: 'Daylight', salon: 'Salon lamps', candle: 'Candlelight', gallery: 'Gallery' } as Record<LightPreset, string>,
    brightness: 'Brightness',
    angle: 'Light angle',
    fire: 'Fire',
    fireNote: 'The flashes of colour a diamond throws.',
    resetLight: 'Reset the light',
    spin: 'Turn it slowly, all the way round',
    views: 'Views',
    viewNames: { hero: 'Three-quarter', front: 'Front', side: 'Profile', top: 'From above', inside: 'Inside the band' } as Record<ViewId, string>,
    explode: 'See its parts',
    parts: { centre: 'Centre stone', head: 'Head & claws', band: 'Band', halo: 'Halo', pave: 'Band stones', sides: 'Side stones', accents: 'Details', engraving: 'Engraving' } as Record<PartId, string>,
    photo: 'Save a picture',
    full: 'Full screen',
    exitFull: 'Leave full screen',
    closePanel: 'Close',
    hintPointer: (mod: string) => `Drag to turn · ${mod} + scroll to zoom`,
    hintTouch: 'Drag to turn · pinch to zoom',
    fallback: 'This browser can’t show the ring in 3D. Every choice still applies, and the summary lists them all.',
    lost: 'The 3D view paused to spare your device.',
    restart: 'Show it again',
    file: 'teresa-and-sons-ring',
  },
  {
    region: 'Vue 3D de votre bague',
    describe: (title) => `${title}, en 3D. Glissez pour la faire tourner, ou utilisez les flèches pour tourner et + ou − pour zoomer.`,
    loading: 'Préparation de la vue 3D…',
    setupGroup: 'Où la voir',
    setups: { studio: 'Studio', salon: 'Salon', hand: 'Sur la main' },
    light: 'Lumière',
    lightPanel: 'La lumière',
    lights: { studio: 'Studio', daylight: 'Lumière du jour', salon: 'Lampes du salon', candle: 'Lueur de chandelle', gallery: 'Galerie' },
    brightness: 'Luminosité',
    angle: 'Angle de la lumière',
    fire: 'Feu',
    fireNote: 'Les éclats de couleur que lance un diamant.',
    resetLight: 'Réinitialiser la lumière',
    spin: 'La faire tourner lentement sur elle-même',
    views: 'Vues',
    viewNames: { hero: 'Trois-quarts', front: 'Face', side: 'Profil', top: 'Vue de dessus', inside: 'Intérieur de l’anneau' },
    explode: 'Voir ses éléments',
    parts: { centre: 'Pierre centrale', head: 'Tête et griffes', band: 'Anneau', halo: 'Halo', pave: 'Pierres de l’anneau', sides: 'Pierres latérales', accents: 'Détails', engraving: 'Gravure' },
    photo: 'Enregistrer une image',
    full: 'Plein écran',
    exitFull: 'Quitter le plein écran',
    closePanel: 'Fermer',
    hintPointer: (mod) => `Glissez pour tourner · ${mod} + défilement pour zoomer`,
    hintTouch: 'Glissez pour tourner · pincez pour zoomer',
    fallback: 'Ce navigateur ne peut pas afficher la bague en 3D. Chaque choix compte quand même, et le récapitulatif les reprend tous.',
    lost: 'La vue 3D s’est mise en pause pour ménager votre appareil.',
    restart: 'La réafficher',
    file: 'teresa-and-sons-bague',
  },
)

/** What the page can ask of the viewer: pictures of the ring (accumulated stills, so they take a moment), a turn, a
 *  view. */
export interface ViewerApi {
  snapshot: (kind: 'card' | 'tryon' | 'view', width?: number, height?: number) => Promise<string>
  turnAround: () => void
  focus: (on: StepId | ViewId) => void
}

interface Props {
  design: RingDesign
  step: StepId
  /** What just changed, in words, shown as the ring rebuilds; a new key shows it again. */
  caption?: { text: string; key: number } | null
  api?: { current: ViewerApi | null }
  className?: string
}

/** A drawing of the ring for browsers without 3D: the band in perspective, the stone's own outline on top. */
function Sketch({ design }: { design: RingDesign }) {
  const ratio = CUTS[design.stone.shape].ratio
  const w = 18 + Math.cbrt(design.stone.carat) * 14
  const pts = outlineOf(design.stone.shape, ratio, 120).map(([x, z]) => `${100 + x * w},${64 - z * w * 0.5}`).join(' ')
  return (
    <svg viewBox="0 0 200 200" className="h-full max-h-72 w-full" aria-hidden>
      <ellipse cx="100" cy="122" rx="56" ry="58" fill="none" stroke="var(--gold-vermeil)" strokeWidth={2 + design.band.width * 1.6} />
      <ellipse cx="100" cy="122" rx="56" ry="58" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" transform="translate(-1.5 -1.5)" />
      <path d={`M${100 - w * 0.32} 78 L100 92 L${100 + w * 0.32} 78`} fill="none" stroke="var(--gold-vermeil)" strokeWidth="2" />
      <polygon points={pts} fill="#f8fbff" stroke="var(--text-taupe)" strokeWidth="1" />
    </svg>
  )
}

/** The ring in 3D, built as it is designed: the setups, the light, views, its parts apart, full screen, a picture.
 *  The 3D engine loads on its own, after the page. */
export default function RingViewer({ design, step, caption, api, className = '' }: Props) {
  const t = useCopy(COPY)
  const { locale } = useLocale()
  const box = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<Stage | null>(null)
  const lightButton = useRef<HTMLButtonElement>(null)
  const viewsButton = useRef<HTMLButtonElement>(null)
  const built = useRef(false)
  const latest = useRef(design)
  latest.current = design
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback' | 'lost'>(() => (canDraw3d() ? 'loading' : 'fallback'))
  const [attempt, setAttempt] = useState(0)
  const [setup, setSetup] = useState<SetupId>('studio')
  const [light, setLight] = useState<LightState>(DEFAULT_LIGHT)
  const [panel, setPanel] = useState<'light' | 'views' | null>(null)
  const [spin, setSpin] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const [building, setBuilding] = useState(false)
  const [hint, setHint] = useState(true)
  const [full, setFull] = useState(false)
  const [shown, setShown] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const motion = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const dark = setup === 'salon'

  // The engine: loaded once the page is up (WebGPU, else WebGL 2), then the ring assembles as the page is uncovered.
  useEffect(() => {
    if (!canDraw3d()) return
    let cancelled = false
    let s: Stage | null = null
    let undo: (() => void) | null = null
    import('./three/stage')
      .then(async ({ Stage }) => {
        if (cancelled || !host.current) return
        const made = await Stage.create(host.current, motion, {
          onLabels: setLabels,
          onBuilding: setBuilding,
          onInteract: () => setHint(false),
          onLost: () => setStatus('lost'),
          // The veil lifts as the ring begins to assemble, its shaders compiled.
          onReady: () => setStatus('ready'),
        })
        if (cancelled) return made.dispose()
        s = made
        stage.current = s
        if (import.meta.env.DEV) (window as unknown as { __ring: Stage }).__ring = s
        undo = onStageClear(() => {
          s?.setDesign(latest.current)
          built.current = true
        })
      })
      .catch(() => !cancelled && setStatus('fallback'))
    return () => {
      cancelled = true
      undo?.()
      s?.dispose()
      stage.current = null
      built.current = false
    }
  }, [attempt])

  // The page's handle on the viewer.
  useEffect(() => {
    if (!api) return
    api.current = {
      snapshot: async (kind, w, h) => (await stage.current?.snapshot(kind, w, h)) ?? '',
      turnAround: () => stage.current?.turnAround(),
      focus: (on) => stage.current?.focus(on),
    }
    return () => {
      api.current = null
    }
  }, [api])

  // At most one rebuild a frame, so a dragged slider stays smooth.
  useEffect(() => {
    if (!built.current) return
    const id = requestAnimationFrame(() => stage.current?.setDesign(design))
    return () => cancelAnimationFrame(id)
  }, [design])

  // Each step brings the camera to what it is about; words engraved send it inside the band.
  const engraved = step === 'details' && !!design.details.engraving.trim()
  useEffect(() => {
    if (built.current) stage.current?.focus(step)
  }, [step, engraved])

  useEffect(() => stage.current?.setLighting(light), [light, status])
  useEffect(() => stage.current?.setAutoRotate(spin), [spin, status])

  useEffect(() => {
    const onFull = () => setFull(!!document.fullscreenElement && document.fullscreenElement === box.current)
    document.addEventListener('fullscreenchange', onFull)
    return () => document.removeEventListener('fullscreenchange', onFull)
  }, [])

  // A panel closes on Escape or a press elsewhere.
  useEffect(() => {
    if (!panel) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePanel()
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-viewer-panel]')) setPanel(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [panel])

  // What changed, shown for a moment.
  useEffect(() => {
    if (!caption) return
    setShown(caption.text)
    const id = window.setTimeout(() => setShown(null), 2200)
    return () => window.clearTimeout(id)
  }, [caption])

  // Closing a panel from inside it hands the focus back to the button that opened it.
  const closePanel = () => {
    const back = panel === 'light' ? lightButton.current : viewsButton.current
    const within = !!document.activeElement?.closest('[data-viewer-panel]') || document.activeElement === document.body
    setPanel(null)
    if (within) back?.focus()
  }

  const chooseSetup = (id: SetupId) => {
    setSetup(id)
    const preset = stage.current?.setSetup(id)
    if (preset) setLight((l) => ({ ...l, preset }))
  }

  const toggleExploded = () => {
    const next = !exploded
    setExploded(next)
    stage.current?.explode(next)
    if (!next) stage.current?.focus(step)
  }

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else box.current?.requestFullscreen?.().catch(() => undefined)
  }

  // The picture is drawn as a still at full size, which takes a moment.
  const save = async () => {
    if (saving) return
    setSaving(true)
    const url = await stage.current?.snapshot('view', 1600, 2000)
    setSaving(false)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.file}.jpg`
    a.click()
  }

  const onKey = (e: React.KeyboardEvent) => {
    const s = stage.current
    if (!s || e.target !== e.currentTarget) return
    const turn: Record<string, [number, number]> = { ArrowLeft: [-0.26, 0], ArrowRight: [0.26, 0], ArrowUp: [0, 0.16], ArrowDown: [0, -0.16] }
    if (turn[e.key]) {
      e.preventDefault()
      s.orbit(...turn[e.key])
      setHint(false)
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      s.zoom(0.82)
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      s.zoom(1.22)
    }
  }

  const chip = `flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition-colors ${dark ? 'bg-black/35 text-[var(--bg-travertine)] hover:bg-black/60' : 'bg-[var(--bg-travertine)]/80 text-[var(--text-espresso)] hover:bg-[var(--bg-travertine)]'}`
  const on = (active: boolean) => (active ? (dark ? '!bg-[var(--gold-champagne)] !text-[var(--bg-vault)]' : '!bg-[var(--text-espresso)] !text-[var(--bg-travertine)]') : '')
  const ink = dark ? 'text-[var(--bg-travertine)]' : 'text-[var(--text-espresso)]'
  const title = describeDesign(design, locale).title
  const ready = status === 'ready'
  // A label whose part has turned out of the frame hides, rather than spilling over the page.
  const inside = (l: Label) => l.x > 8 && l.y > 8 && l.x < (box.current?.clientWidth ?? 0) - 60 && l.y < (box.current?.clientHeight ?? 0) - 12

  return (
    <div ref={box} className={`relative isolate transition-colors duration-700 ${setup === 'salon' ? 'bg-[var(--bg-vault)]' : 'bg-[var(--bg-silk)]'} ${className}`}>
      {/* The canvas, focusable for keyboard turning */}
      <div ref={host} role="img" aria-label={t.region} aria-describedby="ring-viewer-help" tabIndex={ready ? 0 : -1} onKeyDown={onKey} className={`absolute inset-0 overflow-hidden focus-visible:outline focus-visible:-outline-offset-4 focus-visible:outline-[var(--gold-vermeil)] ${ready ? 'cursor-grab active:cursor-grabbing' : ''}`} />
      <p id="ring-viewer-help" className="sr-only">{t.describe(title)}</p>

      {/* Loading, fallback and a paused context */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center">
          <span className="relative h-14 w-14" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-[var(--gold-vermeil)]/30" />
            <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[var(--gold-vermeil)] [animation-duration:1.6s] motion-reduce:animate-none" />
          </span>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--text-taupe)]" role="status">{t.loading}</p>
        </div>
      )}
      {status === 'fallback' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <Sketch design={design} />
          <p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">{t.fallback}</p>
        </div>
      )}
      {status === 'lost' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[var(--bg-travertine)]/90 p-8 text-center backdrop-blur">
          <p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">{t.lost}</p>
          <button type="button" onClick={() => { setStatus('loading'); setAttempt((n) => n + 1) }} className={btnQuiet}>
            <RotateCw size={14} strokeWidth={1.4} /> {t.restart}
          </button>
        </div>
      )}

      {/* The parts, named, when they stand apart */}
      {ready && exploded && labels.map((l) => (
        <span key={l.id} aria-hidden className={`font-spec pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] transition-opacity duration-300 ${ink} ${l.visible && inside(l) ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translate(${l.x}px, ${l.y}px)` }}>
          <span className={`-ml-1 h-2 w-2 rounded-full ring-2 ${dark ? 'bg-[var(--gold-champagne)] ring-black/30' : 'bg-[var(--gold-vermeil)] ring-white/70'}`} />
          <span className={`rounded-full px-2.5 py-1 backdrop-blur ${dark ? 'bg-black/40' : 'bg-[var(--bg-travertine)]/80'}`}>{t.parts[l.id]}</span>
        </span>
      ))}

      {ready && (
        <>
          {/* Where to see it */}
          <div role="group" aria-label={t.setupGroup} className={`absolute left-3 top-3 z-10 flex rounded-full p-1 backdrop-blur ${dark ? 'bg-black/35' : 'bg-[var(--bg-travertine)]/80'}`}>
            {SETUP_IDS.map((id) => (
              <button key={id} type="button" onClick={() => chooseSetup(id)} aria-pressed={setup === id} className={`rounded-full px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors sm:px-4 sm:tracking-[0.18em] ${setup === id ? (dark ? 'bg-[var(--gold-champagne)] text-[var(--bg-vault)]' : 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]') : `${ink} hover:opacity-70`}`}>
                {t.setups[id]}
              </button>
            ))}
          </div>

          {/* The controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 sm:gap-2">
            <div className="relative" data-viewer-panel>
              <button ref={lightButton} type="button" onClick={() => setPanel(panel === 'light' ? null : 'light')} aria-label={t.light} aria-expanded={panel === 'light'} aria-controls="ring-light" className={`${chip} ${on(panel === 'light')}`}><Sun size={17} strokeWidth={1.4} /></button>
              {panel === 'light' && (
                <div id="ring-light" role="dialog" aria-label={t.lightPanel} className="absolute right-full top-0 mr-2 w-[min(17rem,calc(100vw-5.5rem))] bg-[var(--bg-travertine)] p-5 text-[var(--text-espresso)] shadow-[0_18px_50px_-20px_rgba(20,19,17,0.45)]">
                  <div className="flex items-center justify-between">
                    <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.lightPanel}</p>
                    <button type="button" onClick={closePanel} aria-label={t.closePanel} className="-mr-2 p-2 text-[var(--text-taupe)] hover:text-[var(--text-espresso)]"><X size={14} strokeWidth={1.4} /></button>
                  </div>
                  <div role="group" aria-label={t.light} className="mt-3 grid grid-cols-5 gap-2">
                    {LIGHTS.map((p) => (
                      <button key={p} type="button" onClick={() => setLight((l) => ({ ...l, preset: p }))} aria-pressed={light.preset === p} aria-label={t.lights[p]} title={t.lights[p]} className={`aspect-square rounded-full p-0.5 ring-1 transition ${light.preset === p ? 'ring-[var(--text-espresso)]' : 'ring-[var(--border-hairline)] hover:ring-[var(--text-taupe)]'}`}>
                        <span className="block h-full w-full rounded-full" style={{ background: LIGHT_SWATCH[p] }} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-taupe)]">{t.lights[light.preset]}</p>
                  {([
                    ['exposure', t.brightness, 0.5, 1.6, 0.01, formatNumber(light.exposure, { style: 'percent', maximumFractionDigits: 0 })],
                    ['angle', t.angle, 0, Math.PI * 2, 0.01, `${Math.round((light.angle * 180) / Math.PI)}°`],
                    ['fire', t.fire, 0, 2, 0.01, formatNumber(light.fire / 2, { style: 'percent', maximumFractionDigits: 0 })],
                  ] as const).map(([key, label, min, max, stepBy, value]) => (
                    <label key={key} className="mt-4 block">
                      <span className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{label}<span className="font-spec text-[var(--text-espresso)]">{value}</span></span>
                      <input type="range" min={min} max={max} step={stepBy} value={light[key]} onChange={(e) => setLight((l) => ({ ...l, [key]: Number(e.target.value) }))} className="mt-2 w-full accent-[var(--text-espresso)]" />
                    </label>
                  ))}
                  <p className="mt-1 text-[11px] leading-snug text-[var(--text-taupe)]">{t.fireNote}</p>
                  <button type="button" onClick={() => setLight({ ...DEFAULT_LIGHT, preset: light.preset })} className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline decoration-[var(--gold-vermeil)] underline-offset-4 hover:text-[var(--text-espresso)]">{t.resetLight}</button>
                </div>
              )}
            </div>
            <div className="relative" data-viewer-panel>
              <button ref={viewsButton} type="button" onClick={() => setPanel(panel === 'views' ? null : 'views')} aria-label={t.views} aria-expanded={panel === 'views'} aria-controls="ring-views" className={`${chip} ${on(panel === 'views')}`}><Orbit size={17} strokeWidth={1.4} /></button>
              {panel === 'views' && (
                <ul id="ring-views" aria-label={t.views} className="absolute right-full top-0 mr-2 w-48 bg-[var(--bg-travertine)] py-2 text-[var(--text-espresso)] shadow-[0_18px_50px_-20px_rgba(20,19,17,0.45)]">
                  {VIEWS.map((v) => (
                    <li key={v}>
                      <button type="button" onClick={() => { stage.current?.focus(v); closePanel(); setHint(false) }} className="block w-full px-5 py-2.5 text-left text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-[var(--bg-silk)]">{t.viewNames[v]}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {motion && <button type="button" onClick={() => { setSpin((v) => !v); setHint(false) }} aria-label={t.spin} aria-pressed={spin} title={t.spin} className={`${chip} ${on(spin)}`}><span className="font-spec text-[10px] tracking-[0.04em]">360°</span></button>}
            <button type="button" onClick={toggleExploded} aria-label={t.explode} aria-pressed={exploded} title={t.explode} className={`${chip} ${on(exploded)}`}><Layers size={17} strokeWidth={1.4} /></button>
            <button type="button" onClick={save} aria-label={t.photo} aria-busy={saving} title={t.photo} className={`${chip} max-sm:hidden ${saving ? 'animate-pulse motion-reduce:animate-none' : ''}`}><Camera size={17} strokeWidth={1.4} /></button>
            {document.fullscreenEnabled && <button type="button" onClick={toggleFull} aria-label={full ? t.exitFull : t.full} title={full ? t.exitFull : t.full} className={chip}>{full ? <Minimize2 size={16} strokeWidth={1.4} /> : <Maximize2 size={16} strokeWidth={1.4} />}</button>}
          </div>

          {/* How to turn it, until it has been turned */}
          <p aria-hidden className={`font-spec pointer-events-none absolute bottom-3 left-4 z-10 max-w-[calc(100%-5rem)] text-[9px] uppercase leading-relaxed tracking-[0.14em] sm:bottom-4 sm:max-w-[60%] sm:tracking-[0.22em] transition-opacity duration-700 motion-reduce:transition-none ${dark ? 'text-white/60' : 'text-[var(--text-espresso)]/70'} ${hint && !shown ? 'opacity-100' : 'opacity-0'}`}>
            {touch ? t.hintTouch : t.hintPointer(mac ? '⌘' : 'Ctrl')}
          </p>

          {/* What just changed */}
          <p aria-hidden className={`font-spec pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.22em] backdrop-blur transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${dark ? 'bg-black/40 text-[var(--bg-travertine)]' : 'bg-[var(--bg-travertine)]/85 text-[var(--text-espresso)]'} ${shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
            {shown ?? ''}
          </p>

          {/* A hairline that runs while the ring is being built */}
          <span aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px overflow-hidden transition-opacity duration-500 ${building ? 'opacity-100' : 'opacity-0'}`}>
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[ring-build_1.4s_ease-in-out_infinite] bg-[var(--gold-vermeil)] motion-reduce:animate-none" />
          </span>
        </>
      )}
    </div>
  )
}
