/** The two-hairline menu glyph. Its lines fold into a cross when `open`; the short one stretches on hover or focus. */
export default function Burger({ open = false }: { open?: boolean }) {
  const line = 'absolute left-0 h-[1.5px] bg-current transition-[translate,rotate,width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-0'
  return (
    <span aria-hidden="true" className="relative block h-[9.5px] w-[22px]">
      <span className={`${line} top-0 w-[22px] ${open ? 'translate-y-[4px] rotate-45' : ''}`} />
      <span className={`${line} bottom-0 ${open ? 'w-[22px] -translate-y-[4px] -rotate-45' : 'w-[14px] group-hover:w-[22px] group-focus-visible:w-[22px]'}`} />
    </span>
  )
}
