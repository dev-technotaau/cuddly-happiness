import { ArrowUpRight } from 'lucide-react'
import { IMG } from '../../data/catalog'
import SectionHeader from './SectionHeader'

const TILES = [IMG.earrings3, IMG.bracelet2, IMG.rings, IMG.necklace1, IMG.bridal2, IMG.watch3]

export default function SocialGrid() {
  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-28 lg:px-12 lg:pb-36">
      <SectionHeader
        index="09"
        eyebrow="@teresaandsons"
        title={<>Worn in <em className="text-[var(--gold-vermeil)]">Montréal</em></>}
        aside={<span className="link-line">Follow #PorteTeresa</span>}
      />
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {TILES.map((src, i) => (
          <a key={src} href="#/" onClick={(e) => e.preventDefault()} data-reveal={i * 0.04} className="group relative aspect-square overflow-hidden">
            <img src={src} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--bg-vault)]/0 text-white opacity-0 transition-all duration-500 group-hover:bg-[var(--bg-vault)]/40 group-hover:opacity-100">
              <ArrowUpRight size={20} strokeWidth={1.3} />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
