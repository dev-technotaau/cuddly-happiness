// The hand tracker: Google's MediaPipe hand landmarker, loaded the first time a ring is tried on in 3D and kept for the
// visit. It runs on the camera's frames or on a photo, entirely in the browser; nothing it sees leaves the device. Its
// engine comes from jsDelivr and its model from Google's model storage, both pinned (the theme should host them).
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'
import type { Hand, V3 } from './fingerPose'

/** Keep in step with package.json: the engine's files must be the library's own version. */
const VERSION = '1.0.1'
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export interface Tracker {
  /** The hand in a camera frame; `time` in ms, rising from frame to frame. */
  video(source: HTMLVideoElement, time: number): Hand | null
  /** The hand in a photo. */
  image(source: HTMLImageElement): Promise<Hand | null>
}

let loading: Promise<Tracker> | null = null
let progress = 0
const listeners = new Set<(p: number) => void>()

/** The tracker, loaded once; `onProgress` hears how much of the model has arrived (0–1). */
export function loadTracker(onProgress?: (p: number) => void): Promise<Tracker> {
  if (onProgress) {
    listeners.add(onProgress)
    onProgress(progress)
  }
  if (!loading) {
    loading = load().catch((e) => {
      // A failed load (offline, blocked) can be tried again on the next visit to the studio.
      loading = null
      throw e
    })
  }
  return loading.finally(() => onProgress && listeners.delete(onProgress))
}

async function load(): Promise<Tracker> {
  const [files, model] = await Promise.all([FilesetResolver.forVisionTasks(WASM), fetchModel()])
  const make = (delegate: 'GPU' | 'CPU') =>
    HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetBuffer: model, delegate },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.5,
    })
  // The GPU is quicker; a browser without it for this (or a blocked context) falls back to the CPU.
  const landmarker = await make('GPU').catch(() => make('CPU'))
  let mode: 'VIDEO' | 'IMAGE' = 'VIDEO'
  let last = -1
  return {
    video(source, time) {
      if (mode !== 'VIDEO' || !source.videoWidth) return null
      // Timestamps must rise; two frames in one millisecond share the first's answer.
      const t = Math.max(time, last + 1)
      last = t
      return handOf(landmarker.detectForVideo(source, t), source.videoWidth, source.videoHeight)
    },
    async image(source) {
      mode = 'IMAGE'
      await landmarker.setOptions({ runningMode: 'IMAGE' })
      try {
        return handOf(landmarker.detect(source), source.naturalWidth, source.naturalHeight)
      } finally {
        await landmarker.setOptions({ runningMode: 'VIDEO' })
        mode = 'VIDEO'
      }
    },
  }
}

/** The model, read as it arrives so the studio can show its progress. */
async function fetchModel(): Promise<Uint8Array> {
  const res = await fetch(MODEL)
  if (!res.ok || !res.body) throw new Error(`hand model: ${res.status}`)
  const total = Number(res.headers.get('content-length')) || 7_800_000
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let got = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    got += value.length
    progress = Math.min(0.99, got / total)
    listeners.forEach((l) => l(progress))
  }
  const out = new Uint8Array(got)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  progress = 1
  listeners.forEach((l) => l(1))
  return out
}

/** The first hand of a result, in the picture's pixels, named as the tracker names it. */
// Checked on photographs of the back of a hand: the tracker's "Left" is a left hand in the picture as given.
function handOf(r: HandLandmarkerResult, w: number, h: number): Hand | null {
  const marks = r.landmarks[0]
  const label = (r.handedness ?? r.handednesses)?.[0]?.[0]
  if (!marks || marks.length < 21 || !label) return null
  return {
    points: marks.map((m) => [m.x * w, m.y * h, m.z * w] as V3),
    side: label.categoryName === 'Left' ? 'left' : 'right',
    score: label.score,
  }
}
