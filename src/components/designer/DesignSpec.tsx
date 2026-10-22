import { CLARITIES, COLOURS, CUTS, headMetal, innerDiameter, type Layout, type RingDesign } from '../../data/ring'
import { RING_COPY } from '../../data/ringCopy'
import { bilingual, formatNumber, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { sizeLabel } from '../pdp/RingSize'

const COPY = bilingual(
  {
    groups: { stone: 'The centre stone', setting: 'The setting', claws: 'The claws', band: 'The band', metal: 'The metal', details: 'The details', size: 'The size', whole: 'The whole ring' },
    stone: 'Stone',
    weight: 'Weight',
    measures: 'Measurements',
    colour: 'Colour',
    clarity: 'Clarity',
    quality: 'Quality',
    report: 'Report',
    gia: 'GIA grading report',
    gem: 'Gemmological report',
    style: 'Style',
    height: 'Height',
    rise: (mm: string) => `${mm} mm above the finger`,
    shoulders: 'Shoulders',
    straight: 'Straight',
    sideStones: 'Side stones',
    pair: (shape: string, ct: string) => `2 × ${ct} ct · ${shape.toLowerCase()} · GIA reports`,
    stones: (n: number, ct: string) => `${n} diamond${n === 1 ? '' : 's'} · ${ct} ct`,
    held: 'Held by',
    bezel: 'A bezel: no claws',
    claws: 'Claws',
    tips: 'Tips',
    points: 'Points',
    profile: 'Profile',
    width: 'Width',
    widthMm: (w: string) => `${w} mm`,
    tapered: (w: string, top: string) => `${w} mm, narrowing to ${top} mm`,
    diamonds: 'Diamonds',
    none: 'None',
    band: 'Band',
    claw: 'Claws',
    bezelMetal: 'Bezel',
    finish: 'Finish',
    metalWeight: 'Weight',
    grams: (g: string) => `${g} g`,
    inside: 'Inside the band',
    engraved: 'Engraving',
    font: (name: string) => `${name} lettering`,
    nothing: 'Nothing hidden: the ring as it is.',
    size: 'Size',
    diameter: (mm: string) => `${mm} mm inside`,
    unsized: 'Not chosen yet',
    total: 'Total weight',
    set: 'Stones set',
    made: 'Made',
    weeks: (n: number) => `By hand in Montréal, in about ${n} weeks`,
  },
  {
    groups: { stone: 'La pierre centrale', setting: 'La monture', claws: 'Les griffes', band: 'L’anneau', metal: 'Le métal', details: 'Les détails', size: 'La taille', whole: 'La bague entière' },
    stone: 'Pierre',
    weight: 'Poids',
    measures: 'Dimensions',
    colour: 'Couleur',
    clarity: 'Pureté',
    quality: 'Qualité',
    report: 'Rapport',
    gia: 'Rapport de classement GIA',
    gem: 'Rapport gemmologique',
    style: 'Style',
    height: 'Hauteur',
    rise: (mm) => `${mm} mm au-dessus du doigt`,
    shoulders: 'Épaules',
    straight: 'Droites',
    sideStones: 'Pierres latérales',
    pair: (shape, ct) => `2 × ${ct} ct · ${shape.toLowerCase()} · rapports GIA`,
    stones: (n, ct) => `${n} diamant${n < 2 ? '' : 's'} · ${ct} ct`,
    held: 'Maintien',
    bezel: 'Serti clos : pas de griffes',
    claws: 'Griffes',
    tips: 'Pointes',
    points: 'Pointes de la pierre',
    profile: 'Profil',
    width: 'Largeur',
    widthMm: (w) => `${w} mm`,
    tapered: (w, top) => `${w} mm, s’affinant à ${top} mm`,
    diamonds: 'Diamants',
    none: 'Aucun',
    band: 'Anneau',
    claw: 'Griffes',
    bezelMetal: 'Serti clos',
    finish: 'Finition',
    metalWeight: 'Poids',
    grams: (g) => `${g} g`,
    inside: 'À l’intérieur de l’anneau',
    engraved: 'Gravure',
    font: (name) => `Écriture ${name.toLowerCase()}`,
    nothing: 'Rien de caché : la bague telle quelle.',
    size: 'Taille',
    diameter: (mm) => `${mm} mm de diamètre intérieur`,
    unsized: 'Pas encore choisie',
    total: 'Poids total',
    set: 'Pierres serties',
    made: 'Fabrication',
    weeks: (n) => `À la main à Montréal, en environ ${n} semaines`,
  },
)

const FONT_STYLE = { script: { fontFamily: "'Pinyon Script', cursive" }, serif: { fontFamily: "'Baskervville', serif", fontStyle: 'italic' }, block: { fontFamily: "'Jost', sans-serif", letterSpacing: '0.12em' } } as const

interface Props {
  design: RingDesign
  layout: Layout
  metalWeight: number
  stones: number
  weeks: number
}

/** Everything the ring is, part by part, with its measurements: what the atelier would write on the job sheet. */
export default function DesignSpec({ design: d, layout: L, metalWeight, stones, weeks }: Props) {
  const t = useCopy(COPY)
  const r = useCopy(RING_COPY)
  const catalog = useCatalog()
  const mm = (n: number) => formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const ct = (n: number) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const diamond = d.stone.type === 'diamond'
  // A grade's band in words: G is near colourless, VS1 very slight.
  const within = <T extends string>(order: T[], value: T, [a, b]: [T, T, string]) => order.indexOf(a) <= order.indexOf(value) && order.indexOf(value) <= order.indexOf(b)
  const colourBand = r.colourBands.find((x) => within(COLOURS, d.stone.colour, x))?.[2] ?? ''
  const clarityBand = r.clarityBands.find((x) => within(CLARITIES, d.stone.clarity, x))?.[2] ?? ''
  const head = headMetal(d)
  const bezel = d.setting.style === 'bezel'
  const melee = (m: { count: number; carat: number } | null) => (m ? t.stones(m.count, ct(m.carat)) : null)
  const details = [
    d.details.hiddenHalo && L.hiddenHalo && [r.details.hiddenHalo.name, melee(L.hiddenHalo)],
    d.details.peekaboo && L.peekaboo && [r.details.peekaboo.name, melee(L.peekaboo)],
    d.details.surprise && L.surprise && [r.details.surprise.name, melee(L.surprise)],
    d.details.milgrain && [r.details.milgrain.name, r.details.milgrain.note],
  ].filter((x): x is [string, string] => !!x)

  const groups: { id: keyof typeof t.groups; rows: [string, React.ReactNode][] }[] = [
    {
      id: 'stone',
      rows: [
        [t.stone, `${r.types[d.stone.type].name} · ${r.shapes[d.stone.shape].name}`],
        [t.weight, `${ct(d.stone.carat)} ct`],
        [t.measures, `${mm(L.centre.length)} × ${mm(L.centre.width)} × ${mm(L.centre.depth)} mm`],
        ...(diamond ? ([[t.colour, `${d.stone.colour} · ${colourBand}`], [t.clarity, `${d.stone.clarity} · ${clarityBand}`]] as [string, string][]) : ([[t.quality, r.grades[d.stone.grade].name]] as [string, string][])),
        [t.report, diamond ? t.gia : t.gem],
      ],
    },
    {
      id: 'setting',
      rows: [
        [t.style, r.styles[d.setting.style].name],
        [t.height, `${r.heights[d.setting.height].name} · ${t.rise(mm(L.rise))}`],
        [t.shoulders, d.setting.cathedral ? r.cathedral.name : t.straight],
        ...(L.sides ? ([[t.sideStones, t.pair(r.sides[d.setting.sides], ct(L.sides.carat))]] as [string, string][]) : []),
        ...(L.halo ? ([[r.styles.halo.name, melee(L.halo)!]] as [string, string][]) : []),
      ],
    },
    {
      id: 'claws',
      rows: bezel
        ? [[t.held, t.bezel]]
        : [
            [t.claws, d.prongs.double ? r.double.name : r.counts[d.prongs.count]],
            [t.tips, r.tips[d.prongs.tip].name],
            ...(CUTS[d.stone.shape].points ? ([[t.points, d.prongs.vTips ? r.vTips.name : t.none]] as [string, string][]) : []),
            ...(d.prongs.compass ? ([[r.compass.name, r.compass.note]] as [string, string][]) : []),
          ],
    },
    {
      id: 'band',
      rows: [
        [t.profile, r.forms[d.band.form].name],
        [t.width, d.band.taper ? t.tapered(mm(L.band.width), mm(L.band.topWidth)) : t.widthMm(mm(L.band.width))],
        [t.diamonds, L.pave ? `${r.bandStones[d.band.stones].name} · ${r.coverage[d.band.coverage].toLowerCase()} · ${melee(L.pave)}` : t.none],
      ],
    },
    {
      id: 'metal',
      rows: [
        [t.band, catalog.metal(d.metal.band)],
        [bezel ? t.bezelMetal : t.claw, head === d.metal.band ? r.heads.match : catalog.metal(head)],
        [t.finish, r.finishes[d.metal.finish].name],
        [t.metalWeight, t.grams(mm(metalWeight))],
      ],
    },
    {
      id: 'details',
      rows: [
        ...details,
        ...(d.details.engraving.trim() ? ([[t.engraved, <span key="e"><span className="text-lg normal-case" style={FONT_STYLE[d.details.font]}>{d.details.engraving.trim()}</span><span className="block text-xs text-[var(--text-taupe)]">{t.font(r.fonts[d.details.font])} · {t.inside.toLowerCase()}</span></span>]] as [string, React.ReactNode][]) : []),
        ...(!details.length && !d.details.engraving.trim() ? ([['—', t.nothing]] as [string, string][]) : []),
      ],
    },
    {
      id: 'size',
      rows: [[t.size, d.size ? `${sizeLabel(d.size)} · ${t.diameter(mm(innerDiameter(d.size)))}` : t.unsized]],
    },
    {
      id: 'whole',
      rows: [
        [t.total, `${ct(L.carats.total)} ct`],
        [t.set, formatNumber(stones)],
        [t.made, t.weeks(weeks)],
      ],
    },
  ]

  return (
    <div className="grid gap-px bg-[var(--border-hairline)]">
      {groups.map((g) => (
        <section key={g.id} className="bg-[var(--bg-travertine)] p-5">
          <h4 className="font-spec text-[9px] uppercase tracking-[0.26em] text-[var(--gold-ink)]">{t.groups[g.id]}</h4>
          <dl className="mt-3 space-y-2.5">
            {g.rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 text-sm">
                <dt className="break-words text-[var(--text-taupe)]">{label}</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
