import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Check, Copy, Gift, Link2, Share, X } from 'lucide-react'
import { getLenis } from '../SmoothScroll'
import { copyText, displayUrl, intentUrl, lastChannel, noteShare, shareUrl, type ShareChannel } from '../../lib/share'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'

/** What a share is about: one configured piece, or a list such as the wishlist. Prices arrive already formatted. */
export interface ShareSubject {
  kind: 'piece' | 'list'
  id?: string
  title: string
  eyebrow?: string
  image?: string
  route?: string
  /** The configuration line, e.g. "18k Rose Gold · Size 6". */
  detail?: string
  priceText?: string
  tagline?: string
  /** Present when a gift hint makes sense (pieces you can buy, not rentals). */
  hint?: { metal?: string; size?: string }
  items?: { name: string; route: string; image: string; priceText: string }[]
}

type Mode = 'share' | 'hint'
type Copied = 'link' | 'list' | 'message' | 'text'

const NOTE_MAX = 140
const HINT_MAX = 400
const label = 'font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]'
const field = 'mt-2 w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--text-taupe)] focus:border-[var(--text-espresso)]'
const ring = 'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[var(--text-espresso)]'
const tile = 'group flex h-full w-full flex-col justify-between gap-5 bg-[var(--bg-travertine)] p-4 text-left transition-colors hover:bg-[var(--bg-silk)] focus-visible:bg-[var(--bg-silk)] focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-espresso)]'
const check = 'h-3.5 w-3.5 cursor-pointer accent-[var(--text-espresso)]'
const em = 'text-[var(--gold-vermeil)]'

// The sheet's own words, and the messages it drafts: those go out in the sender's language.
const COPY = bilingual(
  {
    listLead: 'A few pieces I love at Teresa & Sons:',
    by: (title: string) => `${title} by Teresa & Sons`,
    hello: (name: string) => `Hi ${name},\n\n`,
    fallen: (title: string, metal?: string) => `I’ve fallen for a piece at Teresa & Sons: the ${title}${metal ? `, in ${metal}` : ''}.`,
    mySize: (size: string) => ` For the record, my ring size is ${size}.`,
    itIs: (price: string) => ` It’s ${price}.`,
    ideas: '\n\nIn case you’re ever looking for ideas.',
    subjectHint: 'A small hint',
    subjectList: 'My Teresa & Sons wishlist',
    shared: 'Shared',
    statuses: { link: 'Link copied', list: 'List copied, with a link to each piece', message: 'Message copied, with the link', text: 'Text copied, with the link' } as Record<Copied, string>,
    selected: (keys: string) => `Selected. Press ${keys} to copy.`,
    channels: { whatsapp: 'Send it as a message', sms: 'Text it', emailPiece: 'With every detail', emailList: 'The whole list', pinterest: 'Pin the photograph', facebook: 'Post the piece', x: 'Post a link' },
    messages: 'Messages',
    email: 'Email',
    usedLast: 'Used last time',
    copied: 'Copied',
    preview: 'What they’ll see',
    eachLinked: (n: number) => `${n} piece${n === 1 ? '' : 's'}, each with its own link`,
    titleHint: 'Drop a <em>hint</em>',
    titlePiece: 'Share this <em>piece</em>',
    titleList: 'Share your <em>wishlist</em>',
    close: 'Close',
    how: 'How to share',
    share: 'Share',
    hint: 'Drop a hint',
    sendDevice: 'Send from this device',
    shareDevice: 'Share from this device',
    attach: 'Attach the photograph',
    link: 'Link',
    linkLabel: 'Link to this piece',
    copyLink: 'Copy link',
    manual: (keys: string) => `Your browser kept the clipboard to itself; the link is selected, so press ${keys}.`,
    listCopied: 'List copied',
    copyList: 'Copy the list, with a link to each piece',
    note: 'Add a note',
    optional: '(optional)',
    notePiece: 'Thought of you when I saw this.',
    noteList: 'For the birthday list.',
    sendWith: 'Or send it with',
    copyText: 'Copy text',
    copyTextNote: 'For Instagram and the rest',
    quiet: 'A quiet word to someone who might be looking for ideas. It opens in your own messages, and we never contact them.',
    for: 'For',
    theirName: 'Their name (optional)',
    yourHint: 'Your hint',
    mention: (size: string) => `Mention my size (${size})`,
    price: 'Include the price',
    restore: 'Restore the suggested wording',
    selectedShort: (keys: string) => `Selected: press ${keys} to copy.`,
    linkAdded: 'The link is added for you.',
    sendBy: 'Send it by',
    subjectLine: 'Subject: A small hint',
    copy: 'Copy',
    paste: 'Paste it anywhere',
    nothingSent: 'Nothing is sent from our site. Each option opens your own app, and you choose who receives it.',
  },
  {
    listLead: 'Quelques pièces que j’adore chez Teresa & Sons :',
    by: (title) => `${title}, par Teresa & Sons`,
    hello: (name) => `Bonjour ${name},\n\n`,
    fallen: (title, metal) => `J’ai eu un coup de cœur pour une pièce chez Teresa & Sons : « ${title} »${metal ? `, en ${metal.toLowerCase()}` : ''}.`,
    mySize: (size) => ` Pour mémoire, ma taille de bague est ${size}.`,
    itIs: (price) => ` Elle coûte ${price}.`,
    ideas: '\n\nAu cas où tu chercherais des idées.',
    subjectHint: 'Un petit indice',
    subjectList: 'Ma liste de souhaits Teresa & Sons',
    shared: 'Partagé',
    statuses: { link: 'Lien copié', list: 'Liste copiée, avec un lien vers chaque pièce', message: 'Message copié, avec le lien', text: 'Texte copié, avec le lien' },
    selected: (keys) => `Sélectionné. Appuyez sur ${keys} pour copier.`,
    channels: { whatsapp: 'L’envoyer en message', sms: 'Par texto', emailPiece: 'Avec tous les détails', emailList: 'Toute la liste', pinterest: 'Épingler la photo', facebook: 'Publier la pièce', x: 'Publier un lien' },
    messages: 'Messages',
    email: 'Courriel',
    usedLast: 'Utilisé la dernière fois',
    copied: 'Copié',
    preview: 'Ce que verra la personne',
    eachLinked: (n) => `${n} pièce${n < 2 ? '' : 's'}, chacune avec son lien`,
    titleHint: 'Laisser un <em>indice</em>',
    titlePiece: 'Partager cette <em>pièce</em>',
    titleList: 'Partager votre <em>liste</em>',
    close: 'Fermer',
    how: 'Comment partager',
    share: 'Partager',
    hint: 'Laisser un indice',
    sendDevice: 'Envoyer depuis cet appareil',
    shareDevice: 'Partager depuis cet appareil',
    attach: 'Joindre la photo',
    link: 'Lien',
    linkLabel: 'Lien vers cette pièce',
    copyLink: 'Copier le lien',
    manual: (keys) => `Votre navigateur garde le presse-papiers pour lui; le lien est sélectionné, appuyez sur ${keys}.`,
    listCopied: 'Liste copiée',
    copyList: 'Copier la liste, avec un lien vers chaque pièce',
    note: 'Ajouter un mot',
    optional: '(facultatif)',
    notePiece: 'J’ai pensé à toi en voyant ceci.',
    noteList: 'Pour la liste d’anniversaire.',
    sendWith: 'Ou l’envoyer par',
    copyText: 'Copier le texte',
    copyTextNote: 'Pour Instagram et ailleurs',
    quiet: 'Un mot discret à quelqu’un qui cherche peut-être des idées. Il s’ouvre dans votre propre messagerie, et nous ne communiquons jamais avec cette personne.',
    for: 'Pour',
    theirName: 'Son prénom (facultatif)',
    yourHint: 'Votre indice',
    mention: (size) => `Mentionner ma taille (${size})`,
    price: 'Inclure le prix',
    restore: 'Rétablir le texte suggéré',
    selectedShort: (keys) => `Sélectionné : appuyez sur ${keys} pour copier.`,
    linkAdded: 'Le lien est ajouté pour vous.',
    sendBy: 'L’envoyer par',
    subjectLine: 'Objet : Un petit indice',
    copy: 'Copier',
    paste: 'À coller où vous voulez',
    nothingSent: 'Rien n’est envoyé depuis notre site. Chaque option ouvre votre propre application, et c’est vous qui choisissez le destinataire.',
  },
)

/** Columns for a hairline tile grid of `n`, so no row is left with an empty cell. */
const gridFor = (n: number) => `${n === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${n === 2 ? 'sm:grid-cols-2' : n === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`
/** The last tile stretches over whatever its row has left. */
const spanFor = (n: number, i: number) => {
  if (i !== n - 1) return ''
  const phone = n % 2 === 1 && n > 1 ? 'col-span-2' : ''
  if (n === 2 || n === 4) return phone
  return `${phone} ${n % 3 === 1 ? 'sm:col-span-3' : n % 3 === 2 ? 'sm:col-span-2' : phone ? 'sm:col-span-1' : ''}`
}

/**
 * The share dialog: a bottom sheet on phones, a two-column panel from `md`. It knows the configured piece (metal, size,
 * engraving, price in the visitor's currency), offers the device's own share sheet (with the photograph attached where
 * supported), a copyable link, a "drop a hint" message, and channel composers tagged for attribution. Nothing is sent
 * from the site; every option hands off to the visitor's own apps.
 */
export default function ShareSheet({ subject, initialMode = 'share', onClose }: { subject: ShareSubject; initialMode?: Mode; onClose: () => void }) {
  const t = useCopy(COPY)
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const linkField = useRef<HTMLInputElement>(null)
  const hintField = useRef<HTMLTextAreaElement>(null)
  const piece = subject.kind === 'piece'
  const [shown, setShown] = useState(false)
  const [mode, setMode] = useState<Mode>(initialMode === 'hint' && subject.hint ? 'hint' : 'share')
  const [note, setNote] = useState('')
  const [to, setTo] = useState('')
  const [withSize, setWithSize] = useState(true)
  const [withPrice, setWithPrice] = useState(true)
  const [draft, setDraft] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [withPhoto, setWithPhoto] = useState(true)
  const [copied, setCopied] = useState<Copied | null>(null)
  const [manual, setManual] = useState(false)
  const [status, setStatus] = useState('')
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const shortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘C' : 'Ctrl+C'
  const meta = { kind: subject.kind, id: subject.id, mode }

  const close = useCallback(() => {
    setShown(false)
    window.setTimeout(onClose, reduced ? 0 : 380)
  }, [onClose, reduced])

  // Enter on the frame after mount, so the closed state is painted first and the sheet can glide in.
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  // Overlay checklist: hold the page still, close on Escape, and keep Tab inside the dialog.
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea')).filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lenis?.start()
      document.body.style.overflow = prev
    }
  }, [close])

  // Fetch the photograph ahead of the tap: a share sheet must open inside the click, with the file already in hand.
  useEffect(() => {
    if (!canNative || !piece || !subject.image || typeof navigator.canShare !== 'function') return
    const ctrl = new AbortController()
    fetch(subject.image.replace('w=1600', 'w=1200'), { signal: ctrl.signal })
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `${subject.id ?? 'teresa-and-sons'}.jpg`, { type: blob.type || 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) setPhoto(file)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [canNative, piece, subject.image, subject.id])

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(null), 2400)
    return () => window.clearTimeout(id)
  }, [copied])

  const line = [subject.detail, subject.priceText].filter(Boolean).join(' · ')
  const link = (channel?: ShareChannel) => (subject.route ? shareUrl(subject.route, channel) : '')

  // Each channel gets wording that suits it; list links are tagged per channel too.
  const shareText = (channel: ShareChannel) => {
    const lead = note.trim()
    if (!piece) {
      const rows = (subject.items ?? []).map((it) => `• ${it.name} — ${it.priceText}\n  ${shareUrl(it.route, channel)}`)
      return `${lead || t.listLead}\n\n${rows.join('\n')}`
    }
    if (channel === 'x') return `${lead ? `${lead} ` : ''}${t.by(subject.title)}, Montréal`
    if (channel === 'pinterest') return `${subject.title}. ${subject.tagline ? `${subject.tagline} ` : ''}Teresa & Sons, Montréal.`
    return `${lead ? `${lead}\n\n` : ''}${t.by(subject.title)}${line ? ` — ${line}` : ''}.`
  }

  const suggested = useMemo(() => {
    const h = subject.hint
    return [
      to.trim() ? t.hello(to.trim()) : '',
      t.fallen(subject.title, h?.metal),
      h?.size && withSize ? t.mySize(h.size) : '',
      withPrice && subject.priceText ? t.itIs(subject.priceText) : '',
      t.ideas,
    ].join('')
  }, [to, withSize, withPrice, subject, t])
  const hint = draft ?? suggested

  const emailSubject = mode === 'hint' ? t.subjectHint : piece ? `${subject.title} — Teresa & Sons` : t.subjectList

  const shareNative = async () => {
    const data: ShareData = { title: subject.title, text: mode === 'hint' ? hint : shareText('native') }
    if (subject.route) data.url = link('native')
    if (piece && withPhoto && photo) data.files = [photo]
    try {
      await navigator.share(data)
      noteShare('native', meta)
      setStatus(t.shared)
    } catch {
      // Dismissed, or the target refused; the sheet stays open for another route.
    }
  }

  const copy = async (what: Copied) => {
    const text = {
      link: () => link('copy'),
      list: () => shareText('copy'),
      message: () => `${hint}\n\n${link('copy')}`,
      text: () => `${shareText('copy')}\n\n${link('copy')}`,
    }[what]()
    if (await copyText(text)) {
      setCopied(what)
      setManual(false)
      setStatus(t.statuses[what])
      noteShare('copy', meta)
      return
    }
    // The clipboard is out of reach (a locked-down browser): select the text so a keystroke finishes the job.
    const target = what === 'message' ? hintField.current : linkField.current
    target?.focus()
    target?.select()
    setManual(true)
    setStatus(t.selected(shortcut))
  }

  const channels = useMemo(() => {
    const all: { id: ShareChannel; label: string; note: string }[] = [
      { id: 'whatsapp', label: 'WhatsApp', note: t.channels.whatsapp },
      ...(touch ? [{ id: 'sms' as const, label: t.messages, note: t.channels.sms }] : []),
      { id: 'email', label: t.email, note: piece ? t.channels.emailPiece : t.channels.emailList },
      // Pinterest pins a public photograph; a ring drawn here in the browser (the designer's) has none.
      ...(piece && subject.image && /^https?:/.test(subject.image) ? [{ id: 'pinterest' as const, label: 'Pinterest', note: t.channels.pinterest }] : []),
      ...(piece ? [{ id: 'facebook' as const, label: 'Facebook', note: t.channels.facebook }, { id: 'x' as const, label: 'X', note: t.channels.x }] : []),
    ]
    const recent = lastChannel()
    return recent ? [...all.filter((c) => c.id === recent), ...all.filter((c) => c.id !== recent)] : all
  }, [touch, piece, subject.image, t])

  const hintChannels = channels.filter((c) => c.id === 'whatsapp' || c.id === 'sms' || c.id === 'email')
  const href = (id: ShareChannel) => intentUrl(id, { text: mode === 'hint' ? hint : shareText(id), url: link(id), subject: emailSubject, image: subject.image })
  const external = (id: ShareChannel) => id !== 'email' && id !== 'sms'
  const bubble = mode === 'hint' ? hint : note.trim()
  const preview = subject.image?.replace('w=1600', 'w=800')
  // Share mode adds a "Copy text" tile for pieces (Instagram and the rest have no share link); hint mode adds "Copy".
  const shareCount = channels.length + (piece ? 1 : 0)
  const hintCount = hintChannels.length + 1

  const channelTile = (id: ShareChannel, name: string, sub: string, span: string) => (
    <li key={id} className={span}>
      <a href={href(id)} target={external(id) ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => noteShare(id, meta)} className={tile}>
        <span className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{name}</span>
          <ArrowUpRight size={14} strokeWidth={1.4} className="shrink-0 text-[var(--text-linen)] transition-[translate,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold-vermeil)]" />
        </span>
        <span className="text-xs text-[var(--text-taupe)]">{id === lastChannel() ? t.usedLast : sub}</span>
      </a>
    </li>
  )
  const copyTile = (what: Copied, name: string, sub: string, span: string) => (
    <li key={what} className={span}>
      <button type="button" onClick={() => copy(what)} className={tile}>
        <span className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{copied === what ? t.copied : name}</span>
          {copied === what ? <Check size={14} strokeWidth={1.8} className="shrink-0 text-[var(--gold-vermeil)]" /> : <Copy size={14} strokeWidth={1.4} className="shrink-0 text-[var(--text-linen)] transition-colors duration-300 group-hover:text-[var(--gold-vermeil)]" />}
        </span>
        <span className="text-xs text-[var(--text-taupe)]">{sub}</span>
      </button>
    </li>
  )

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-8">
      <div aria-hidden="true" onClick={close} className={`absolute inset-0 bg-[var(--bg-vault)]/55 transition-opacity duration-500 motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`} />
      <div
        ref={panel}
        data-share-sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-lenis-prevent
        className={`relative grid max-h-[92svh] w-full grid-cols-1 overflow-y-auto overscroll-contain bg-[var(--bg-travertine)] shadow-[0_40px_120px_-40px_rgba(20,19,17,0.6)] outline-none transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:max-h-[min(88svh,54rem)] md:max-w-[58rem] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] ${shown ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-6 md:opacity-0'}`}
      >
        {/* What they'll see (md+): the message as it will read, above the card the link unfurls into */}
        <aside className="hidden flex-col bg-[var(--bg-silk)] p-8 md:flex">
          <p className={label}>{t.preview}</p>
          {bubble && <p className="mt-5 line-clamp-[8] whitespace-pre-line border-l-2 border-[var(--gold-vermeil)] bg-[var(--bg-travertine)] px-4 py-3 text-sm leading-relaxed">{bubble}</p>}
          {piece ? (
            <div className="mt-5 border border-[var(--border-hairline)] bg-[var(--bg-travertine)] p-3 shadow-[0_24px_48px_-32px_rgba(20,19,17,0.35)]">
              {preview && <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]"><img src={preview} alt="" className="h-full w-full object-cover" /></div>}
              <div className="px-1 pb-1 pt-4">
                {subject.eyebrow && <p className="font-spec text-[9px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{subject.eyebrow}</p>}
                <p className="font-serif-editorial mt-1.5 text-xl leading-tight">{subject.title}</p>
                {line && <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{line}</p>}
                {subject.route && <p className="font-spec mt-3 truncate text-[10px] text-[var(--text-taupe)]">{displayUrl(subject.route)}</p>}
              </div>
            </div>
          ) : (
            <div className="mt-5 border border-[var(--border-hairline)] bg-[var(--bg-travertine)] p-3">
              <div className="grid grid-cols-2 gap-1">
                {(subject.items ?? []).slice(0, 4).map((it) => (
                  <div key={it.route} className="aspect-square overflow-hidden bg-[var(--bg-silk)]"><img src={it.image.replace('w=1600', 'w=400')} alt="" className="h-full w-full object-cover" /></div>
                ))}
              </div>
              <p className="font-serif-editorial mt-4 px-1 text-xl leading-tight">{t.eachLinked(subject.items?.length ?? 0)}</p>
              <p className="mt-1 truncate px-1 pb-1 text-xs text-[var(--text-taupe)]">{subject.items?.map((it) => it.name).join(' · ')}</p>
            </div>
          )}
        </aside>

        <div className="min-w-0 p-6 sm:p-8">
          {/* Phones: a grip, then the piece in one line */}
          <span aria-hidden="true" className="mx-auto -mt-2 mb-5 block h-1 w-10 rounded-full bg-[var(--border-hairline)] md:hidden" />
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{mode === 'hint' ? 'Un petit indice' : 'Partager'}</p>
              <h2 id={titleId} className="font-serif-editorial mt-3 text-3xl leading-tight sm:text-4xl">
                {rich(mode === 'hint' ? t.titleHint : piece ? t.titlePiece : t.titleList, em)}
              </h2>
            </div>
            <button type="button" onClick={close} aria-label={t.close} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] transition-colors hover:border-[var(--text-espresso)] ${ring}`}>
              <X size={18} strokeWidth={1.4} />
            </button>
          </div>
          {piece && (
            <div className="mt-5 flex items-center gap-4 border-y border-[var(--border-hairline)] py-4 md:hidden">
              {preview && <img src={preview} alt="" className="h-16 w-12 shrink-0 object-cover" />}
              <div className="min-w-0">
                <p className="font-serif-editorial truncate text-lg leading-tight">{subject.title}</p>
                {line && <p className="font-spec mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{line}</p>}
              </div>
            </div>
          )}

          {subject.hint && (
            <div role="tablist" aria-label={t.how} className="mt-6 grid grid-cols-2 border border-[var(--border-hairline)] p-1">
              {(['share', 'hint'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${ring} ${mode === m ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`}
                >
                  {m === 'share' ? <><Share size={13} strokeWidth={1.4} /> {t.share}</> : <><Gift size={13} strokeWidth={1.4} /> {t.hint}</>}
                </button>
              ))}
            </div>
          )}

          <div role={subject.hint ? 'tabpanel' : undefined}>
            {canNative && (
              <div className="mt-7">
                <button type="button" onClick={shareNative} className={`flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 hover:bg-[var(--gold-vermeil)] ${ring}`}>
                  <Share size={15} strokeWidth={1.4} /> {mode === 'hint' ? t.sendDevice : t.shareDevice}
                </button>
                {piece && photo && (
                  <label className="mt-3 flex w-max cursor-pointer items-center gap-2.5 text-xs text-[var(--text-taupe)]">
                    <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} className={check} />
                    {t.attach}
                  </label>
                )}
              </div>
            )}

            {mode === 'share' ? (
              <>
                {piece && subject.route ? (
                  <div className="mt-7">
                    <p className={label}>{t.link}</p>
                    <div className="mt-2 flex border border-[var(--border-hairline)]">
                      <input ref={linkField} readOnly value={displayUrl(subject.route)} aria-label={t.linkLabel} onFocus={(e) => e.target.select()} className="font-spec min-w-0 flex-1 truncate bg-transparent px-4 py-3.5 text-xs text-[var(--text-taupe)] outline-none" />
                      <button type="button" onClick={() => copy('link')} className={`flex shrink-0 items-center gap-2 border-l border-[var(--border-hairline)] px-5 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${ring} ${copied === 'link' ? 'bg-[var(--gold-vermeil)] text-white' : 'hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]'}`}>
                        {copied === 'link' ? <><Check size={13} strokeWidth={1.8} /> {t.copied}</> : <><Link2 size={13} strokeWidth={1.4} /> {t.copyLink}</>}
                      </button>
                    </div>
                    {manual && <p className="mt-2 text-xs text-[var(--text-taupe)]">{t.manual(shortcut)}</p>}
                  </div>
                ) : (
                  <button type="button" onClick={() => copy('list')} className={`mt-7 flex w-full items-center justify-center gap-2 border py-3.5 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${ring} ${copied === 'list' ? 'border-[var(--gold-vermeil)] bg-[var(--gold-vermeil)] text-white' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
                    {copied === 'list' ? <><Check size={13} strokeWidth={1.8} /> {t.listCopied}</> : <><Link2 size={13} strokeWidth={1.4} /> {t.copyList}</>}
                  </button>
                )}

                <label className="mt-7 block">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={label}>{t.note} <span className="normal-case tracking-normal text-[var(--text-taupe)]">{t.optional}</span></span>
                    <span className="font-spec text-[10px] text-[var(--text-taupe)]">{note.length}/{NOTE_MAX}</span>
                  </span>
                  <input value={note} onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))} placeholder={piece ? t.notePiece : t.noteList} className={field} />
                </label>

                <p className={`${label} mt-7`}>{t.sendWith}</p>
                <ul className={`mt-3 grid gap-px border border-[var(--border-hairline)] bg-[var(--border-hairline)] ${gridFor(shareCount)}`}>
                  {channels.map((c, i) => channelTile(c.id, c.label, c.note, spanFor(shareCount, i)))}
                  {piece && copyTile('text', t.copyText, t.copyTextNote, spanFor(shareCount, shareCount - 1))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-7 text-sm leading-relaxed text-[var(--text-taupe)]">{t.quiet}</p>
                <label className="mt-6 block">
                  <span className={label}>{t.for}</span>
                  <input value={to} onChange={(e) => setTo(e.target.value.slice(0, 40))} placeholder={t.theirName} autoComplete="off" className={field} />
                </label>
                <label className="mt-6 block">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={label}>{t.yourHint}</span>
                    <span className="font-spec text-[10px] text-[var(--text-taupe)]">{hint.length}/{HINT_MAX}</span>
                  </span>
                  <textarea ref={hintField} value={hint} onChange={(e) => setDraft(e.target.value.slice(0, HINT_MAX))} rows={6} className={`${field} resize-none leading-relaxed`} />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-taupe)]">
                  {draft === null ? (
                    <>
                      {subject.hint?.size && (
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <input type="checkbox" checked={withSize} onChange={(e) => setWithSize(e.target.checked)} className={check} />
                          {t.mention(subject.hint.size)}
                        </label>
                      )}
                      {subject.priceText && (
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <input type="checkbox" checked={withPrice} onChange={(e) => setWithPrice(e.target.checked)} className={check} />
                          {t.price}
                        </label>
                      )}
                    </>
                  ) : (
                    <button type="button" onClick={() => setDraft(null)} className={`border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)] ${ring}`}>
                      {t.restore}
                    </button>
                  )}
                  <span className="text-[var(--text-taupe)] sm:ml-auto">{manual ? t.selectedShort(shortcut) : t.linkAdded}</span>
                </div>

                <p className={`${label} mt-7`}>{t.sendBy}</p>
                <ul className={`mt-3 grid gap-px border border-[var(--border-hairline)] bg-[var(--border-hairline)] ${gridFor(hintCount)}`}>
                  {hintChannels.map((c, i) => channelTile(c.id, c.label, c.id === 'email' ? t.subjectLine : c.note, spanFor(hintCount, i)))}
                  {copyTile('message', t.copy, t.paste, spanFor(hintCount, hintCount - 1))}
                </ul>
              </>
            )}
          </div>

          <p className="mt-7 text-[11px] leading-relaxed text-[var(--text-taupe)]">{t.nothingSent}</p>
          <p className="sr-only" aria-live="polite">{status}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
