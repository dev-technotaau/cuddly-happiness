// Sharing helpers. Everything here stays on the visitor's device or opens the network's own composer: nothing is sent
// from the storefront, so there is no backend to build. The real theme swaps `shareUrl`'s base for `shop.url` +
// `product.url` and keeps the rest.

/** Where a share goes. `copy` and `native` stay on the device; the others open that service's composer. */
export type ShareChannel = 'native' | 'copy' | 'whatsapp' | 'sms' | 'email' | 'pinterest' | 'facebook' | 'x'

/** The address of a hash route, tagged with the channel so storefront analytics can credit it (Shopify reads `utm_*`). */
export const shareUrl = (route: string, channel?: ShareChannel) => {
  const tag = channel ? `?utm_source=${channel}&utm_medium=share` : ''
  return `${window.location.origin}${window.location.pathname}${tag}${route}`
}

/** The same address, shown without protocol or tags. */
export const displayUrl = (route: string) => `${window.location.host}${window.location.pathname}${route}`

const enc = encodeURIComponent

/** The composer URL for a channel. `text` is the message without the link; the link is placed where each service expects it. */
export function intentUrl(channel: ShareChannel, m: { text: string; url: string; subject?: string; image?: string }) {
  switch (channel) {
    case 'whatsapp': return `https://wa.me/?text=${enc(`${m.text}\n\n${m.url}`)}`
    case 'sms': return `sms:?&body=${enc(`${m.text} ${m.url}`)}`
    case 'email': return `mailto:?subject=${enc(m.subject ?? '')}&body=${enc(`${m.text}\n\n${m.url}`)}`
    case 'pinterest': return `https://www.pinterest.com/pin/create/button/?url=${enc(m.url)}&media=${enc(m.image ?? '')}&description=${enc(m.text)}`
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${enc(m.url)}`
    case 'x': return `https://x.com/intent/post?text=${enc(m.text)}&url=${enc(m.url)}`
    default: return m.url
  }
}

/** Copies text, falling back to a hidden textarea where the async clipboard is unavailable. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

// The channel used last in this session leads the list next time.
let last: ShareChannel | null = null
export const lastChannel = () => last

/** Records a share for the session and announces it for analytics (the theme forwards `tns:share` to Shopify's analytics). */
export function noteShare(channel: ShareChannel, detail: { kind: string; id?: string; mode: string }) {
  if (channel !== 'native' && channel !== 'copy') last = channel
  window.dispatchEvent(new CustomEvent('tns:share', { detail: { channel, ...detail } }))
}
