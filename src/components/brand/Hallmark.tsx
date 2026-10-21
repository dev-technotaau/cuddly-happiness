/** The house hallmark, as a maker's punch strikes it inside a ring: T&S in a cut-corner cartouche, with the city and
 *  the year. It signs what leaves the bench (the product page's maker's note, "Made here", the footer). */
export default function Hallmark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <path d="M11 20.5 17.5 14h29l6.5 6.5v23L46.5 50h-29L11 43.5Z" stroke="currentColor" strokeWidth="1" />
      <path d="M14 21.8 18.8 17h26.4l4.8 4.8v20.4L45.2 47H18.8L14 42.2Z" stroke="currentColor" strokeWidth="0.45" opacity="0.55" />
      <text x="32" y="35.5" textAnchor="middle" fill="currentColor" style={{ fontFamily: "'Baskervville', serif", fontSize: '15px', letterSpacing: '0.5px' }}>
        T<tspan style={{ fontStyle: 'italic' }}>&amp;</tspan>S
      </text>
      <text x="32" y="42.6" textAnchor="middle" fill="currentColor" style={{ fontFamily: "'Jost', sans-serif", fontSize: '4.4px', letterSpacing: '1.5px' }}>
        MTL · 1962
      </text>
    </svg>
  )
}
