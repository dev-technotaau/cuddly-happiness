import { useEffect, useRef } from 'react'
import type { RingDesign } from '../../data/ring'
import type { LightPreset } from '../designer/three/lighting'
import { TryOnStage } from '../designer/three/tryOnStage'
import { Steady, fingerPose, hintFor, placedPose, type FingerId, type FingerPose, type Hand, type Hint } from './fingerPose'
import { loadTracker, type Tracker } from './handTracker'

/** The try-on's state: the tracker loading, a live hand (or none yet), a photo read, placed by hand, or the view lost. */
export type TrackState = { phase: 'loading'; progress: number } | { phase: 'live'; hint: Hint | 'looking' } | { phase: 'photo'; found: boolean } | { phase: 'manual'; reason: 'failed' | 'chosen' } | { phase: 'lost' }

export interface RingTryOnApi {
  /** Draws the ring, as it is now, over a photograph being composed (`w` × `h`: the stage, scaled). */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void
}

type Media = HTMLVideoElement | HTMLImageElement

interface Props {
  design: RingDesign
  /** The picture under the ring: the camera's video or a photo, shown by the studio (`object-cover`). */
  media: Media | null
  source: 'camera' | 'photo'
  mirror: boolean
  finger: FingerId
  /** The ring's size on the finger, against the finger as measured (0.85–1.15). */
  fit: number
  light: LightPreset | 'auto'
  /** The studio's placement (percent of the stage, degrees, scale), for a ring placed by hand. */
  placed: { x: number; y: number; rotate: number; scale: number }
  /** The visitor places the ring by hand. */
  manual: boolean
  api: { current: RingTryOnApi | null }
  onState: (s: TrackState) => void
}

/** The ring in 3D on the visitor's hand: tracked in the camera or found in a photo, steadied and lit for the room. */
export default function RingTryOn({ design, media, source, mirror, finger, fit, light, placed, manual, api, onState }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<TryOnStage | null>(null)
  const tracker = useRef<Tracker | null>(null)
  const failed = useRef(false)
  const steady = useRef(new Steady())
  // The hand found in the picture (its pixels) and the ring's pose on it; for a photo, whether it has been read.
  const found = useRef<{ hand: Hand; pose: FingerPose } | null>(null)
  const read = useRef(false)
  // The latest of everything the loops read, so they never restart for a slider.
  const now = useRef({ media, source, mirror, finger, fit, placed, manual })
  now.current = { media, source, mirror, finger, fit, placed, manual }
  const last = useRef('')
  const report = useRef(onState)
  report.current = (s: TrackState) => {
    const key = JSON.stringify(s)
    if (key === last.current) return
    last.current = key
    onState(s)
  }
  const room = useRef({ preset: 'studio' as LightPreset, next: 'studio' as LightPreset, streak: 0 })

  /** The ring where it belongs now: on the found hand, where the visitor put it, or nowhere yet. */
  const draw = useRef(() => {})
  draw.current = () => {
    const s = stage.current
    if (!s) return
    const n = now.current
    const byHand = n.manual || failed.current || (n.source === 'photo' && read.current && !found.current)
    if (byHand) s.setPose(placedPose((n.placed.x / 100) * s.w, (n.placed.y / 100) * s.h, n.placed.rotate, s.w * 0.16 * n.placed.scale * n.fit))
    else if (found.current && n.media) s.setPose(toStage(found.current.pose, n.media, s.w, s.h, n.mirror, n.fit))
    else s.setPose(null)
    s.render()
  }

  /** A photo: the hand is looked for once; without one, the ring waits to be placed by hand. */
  const readPhoto = useRef(async () => {})
  readPhoto.current = async () => {
    const img = now.current.media
    const t = tracker.current
    if (!(img instanceof HTMLImageElement) || !t) return
    if (!img.complete) await img.decode().catch(() => undefined)
    const hand = await t.image(img).catch(() => null)
    if (now.current.media !== img) return
    found.current = hand ? { hand, pose: fingerPose(hand, now.current.finger) } : null
    read.current = true
    if (!now.current.manual) report.current({ phase: 'photo', found: !!hand })
    draw.current()
  }

  // The stage: made once, freed on leaving.
  useEffect(() => {
    if (!host.current) return
    const s = new TryOnStage(host.current, () => report.current({ phase: 'lost' }))
    stage.current = s
    if (import.meta.env.DEV) (window as unknown as { __tryon: unknown }).__tryon = { stage: s, found, now }
    s.setDesign(design)
    api.current = { draw: (ctx, w, h) => ctx.drawImage(s.capture(), 0, 0, w, h) }
    draw.current()
    return () => {
      api.current = null
      s.dispose()
      stage.current = null
    }
  }, [])

  useEffect(() => {
    stage.current?.setDesign(design)
    draw.current()
  }, [design])

  // The tracker: loaded once for the visit; a browser that can't run it falls back to placing by hand.
  useEffect(() => {
    let live = true
    // In steps of 5%, so the studio redraws twenty times, not once per chunk.
    loadTracker((p) => live && !tracker.current && report.current({ phase: 'loading', progress: Math.round(p * 20) / 20 }))
      .then((t) => {
        if (!live) return
        tracker.current = t
        if (now.current.manual) report.current({ phase: 'manual', reason: 'chosen' })
        else if (now.current.source === 'photo') void readPhoto.current()
        else report.current({ phase: 'live', hint: 'looking' })
      })
      .catch(() => {
        if (!live) return
        failed.current = true
        report.current({ phase: 'manual', reason: 'failed' })
        draw.current()
      })
    return () => {
      live = false
    }
  }, [])

  // Placing by hand, or handing back to the tracker.
  useEffect(() => {
    if (manual) report.current({ phase: 'manual', reason: 'chosen' })
    else if (failed.current) report.current({ phase: 'manual', reason: 'failed' })
    else if (tracker.current) {
      if (source === 'photo') report.current({ phase: 'photo', found: !!found.current })
      else report.current({ phase: 'live', hint: found.current ? 'ok' : 'looking' })
    }
    draw.current()
  }, [manual])

  // A new finger, fit, placement or mirror moves the ring at once.
  useEffect(() => {
    if (found.current) found.current = { ...found.current, pose: fingerPose(found.current.hand, finger) }
    draw.current()
  }, [finger, fit, mirror, placed.x, placed.y, placed.rotate, placed.scale])

  // A new picture: the last hand is forgotten; a photo is read.
  useEffect(() => {
    steady.current.reset()
    found.current = null
    read.current = false
    if (source === 'photo' && tracker.current) void readPhoto.current()
    else draw.current()
  }, [media, source])

  // The room's light: read from the picture (its brightness and warmth), or the visitor's choice.
  useEffect(() => {
    const s = stage.current
    if (!s) return
    if (light !== 'auto') {
      s.setLight(light, 1)
      draw.current()
      return
    }
    const sample = () => {
      const r = readRoom(now.current.media)
      if (!r) return
      const rm = room.current
      // A new kind of light must hold for three readings; the brightness follows at once.
      if (r.preset === rm.next) rm.streak++
      else {
        rm.next = r.preset
        rm.streak = 1
      }
      if (rm.streak >= 3) rm.preset = rm.next
      s.setLight(rm.preset, r.exposure)
      // A tracked hand is drawn every frame anyway; a photo or a ring placed by hand is redrawn for the new light.
      if (now.current.source === 'photo' || now.current.manual || failed.current) draw.current()
    }
    if (source === 'photo') room.current.streak = 3
    sample()
    const id = source === 'camera' ? window.setInterval(sample, 700) : 0
    return () => window.clearInterval(id)
  }, [light, media, source])

  // The camera: each new frame, the hand is found, the ring placed and drawn, all within that frame.
  useEffect(() => {
    const video = media
    if (source !== 'camera' || !(video instanceof HTMLVideoElement)) return
    let stop = false
    let handle = 0
    let lostAt = 0
    let seen = -1
    // A device slow to find the hand skips every other frame, so the camera keeps its pace.
    let skip = false
    // A new hint must hold for eight frames, so a hand at a threshold doesn't make the status flicker (and talk).
    let shown: Hint | 'looking' = 'looking'
    let pending: Hint | 'looking' = 'looking'
    let held = 0
    const settle = (h: Hint | 'looking') => {
      if (h === 'looking' || shown === 'looking' || h === shown) {
        shown = pending = h
        held = 0
      } else if (h !== pending) {
        pending = h
        held = 1
      } else if (++held >= 8) {
        shown = h
        held = 0
      }
      return shown
    }
    const next = () => {
      handle = 'requestVideoFrameCallback' in video ? video.requestVideoFrameCallback((t) => frame(t)) : requestAnimationFrame(frame)
    }
    const frame = (t: number) => {
      if (stop) return
      if (skip) {
        skip = false
        next()
        return
      }
      const tr = tracker.current
      if (tr && !now.current.manual && video.readyState >= 2 && video.currentTime !== seen) {
        seen = video.currentTime
        const started = performance.now()
        const hand = tr.video(video, t)
        skip = performance.now() - started > 40
        if (hand) {
          lostAt = 0
          const pose = steady.current.next(fingerPose(hand, now.current.finger), t)
          found.current = { hand, pose }
          report.current({ phase: 'live', hint: settle(hintFor(hand, pose, video.videoWidth, video.videoHeight)) })
          draw.current()
        } else if (found.current) {
          // A moment's loss keeps the ring where it was; a longer one takes it off.
          lostAt ||= t
          if (t - lostAt > 320) {
            found.current = null
            steady.current.reset()
            report.current({ phase: 'live', hint: settle('looking') })
            draw.current()
          }
        } else report.current({ phase: 'live', hint: settle('looking') })
      }
      next()
    }
    next()
    return () => {
      stop = true
      // Each handle belongs to the call that made it; the other canceller could stop someone else's frame.
      if ('cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
    }
  }, [media, source])

  return <div ref={host} aria-hidden className="pointer-events-none absolute inset-0" />
}

/** A pose from the picture's pixels to the stage's: the picture is shown `object-cover`, and mirrored for a selfie. */
function toStage(p: FingerPose, media: Media, w: number, h: number, mirror: boolean, fit: number): FingerPose {
  const mw = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth
  const mh = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight
  const s = Math.max(w / mw, h / mh)
  const x = (w - mw * s) / 2 + p.x * s
  const m = mirror ? -1 : 1
  return { x: mirror ? w - x : x, y: (h - mh * s) / 2 + p.y * s, axis: [p.axis[0] * m, p.axis[1], p.axis[2]], up: [p.up[0] * m, p.up[1], p.up[2]], width: p.width * s * fit }
}

const sampler = typeof document !== 'undefined' ? document.createElement('canvas') : null

/** The room in the picture: warm lamps, daylight or neutral, and how bright, from a tiny copy of it. */
function readRoom(media: Media | null): { preset: LightPreset; exposure: number } | null {
  if (!media || !sampler) return null
  const ready = media instanceof HTMLVideoElement ? media.readyState >= 2 : media.complete && media.naturalWidth > 0
  if (!ready) return null
  sampler.width = 24
  sampler.height = 32
  const ctx = sampler.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  try {
    ctx.drawImage(media, 0, 0, 24, 32)
    const d = ctx.getImageData(0, 0, 24, 32).data
    let r = 0
    let g = 0
    let b = 0
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]
      g += d[i + 1]
      b += d[i + 2]
    }
    const n = d.length / 4
    r /= n
    g /= n
    b /= n
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const warm = (r - b) / (r + g + b + 1)
    // A diamond mirrors its room: the lamplit salon only for a warm, dim picture; cool light is daylight; anything else
    // (a bright sunset included) the studio's, which gives a stone its sparkle.
    return { preset: warm > 0.06 && lum < 0.36 ? 'salon' : warm < -0.04 ? 'daylight' : 'studio', exposure: Math.min(1.3, Math.max(0.72, 0.66 + lum * 0.72)) }
  } catch {
    // A picture from another site without permission can't be read; the light stays as it is.
    return null
  }
}
