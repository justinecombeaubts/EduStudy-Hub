// Décor de la Sidebar : quart de "cercle d'invocation" centré sur le coin haut-gauche du menu
// (seul le quart visible est dans le cadre). Couleur via `currentColor` → argent en clair, doré
// en sombre (variable --motif, voir index.css). Purement décoratif, non interactif.
const R = 250 // rayon extérieur (unités du viewBox)

const rad = (deg) => (deg * Math.PI) / 180
const pt = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))]
const polygone = (r, n, decalage = 0) =>
  Array.from({ length: n }, (_, i) => pt(r, decalage + (360 / n) * i).join(',')).join(' ')
// Étoile {n/k} : relie chaque sommet au k-ième suivant.
const etoile = (r, n, k, decalage = 0) =>
  Array.from({ length: n }, (_, i) => pt(r, decalage + (360 / n) * ((i * k) % n)).join(',')).join(' ')

// Graduations de l'anneau extérieur (longues tous les 15°, courtes tous les 5°), sur le quart visible.
const GRADUATIONS = Array.from({ length: 19 }, (_, i) => i * 5)
// Runes simplifiées posées sur la bande entre r=205 et r=233.
const RUNES = Array.from({ length: 9 }, (_, i) => 5 + i * 10)

function Rune({ angle, index }) {
  const [x, y] = pt(219, angle)
  const forme = index % 3
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle + 90})`}>
      {forme === 0 && <path d="M0 -6 L5 4 L-5 4 Z" />}
      {forme === 1 && <path d="M0 -6 L5 0 L0 6 L-5 0 Z" />}
      {forme === 2 && (
        <>
          <circle r="4" />
          <path d="M0 -7 V7 M-6 0 H6" />
        </>
      )}
    </g>
  )
}

function CercleInvocation({ className = '' }) {
  return (
    <svg viewBox={`0 0 ${R} ${R}`} className={className} aria-hidden="true" focusable="false">
      <g className="cercle-invocation" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        {/* Anneaux */}
        <circle r={R - 2} strokeWidth="1.4" />
        <circle r={R - 12} />
        <circle r={205} />
        <circle r={150} strokeDasharray="2 5" />
        <circle r={95} />
        <circle r={58} strokeWidth="1.2" />
        <circle r={22} />

        {/* Graduations */}
        {GRADUATIONS.map((a) => {
          const [x1, y1] = pt(a % 15 === 0 ? R - 24 : R - 18, a)
          const [x2, y2] = pt(R - 12, a)
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}

        {/* Runes */}
        <g strokeWidth="0.9">
          {RUNES.map((a, i) => (
            <Rune key={a} angle={a} index={i} />
          ))}
        </g>

        {/* Étoiles inscrites */}
        <polygon points={etoile(205, 6, 2, 15)} />
        <polygon points={etoile(205, 6, 2, 45)} />
        <polygon points={polygone(150, 8, 22.5)} strokeOpacity="0.8" />
        <polygon points={etoile(95, 5, 2, 9)} />

        {/* Rayons intérieurs */}
        {Array.from({ length: 7 }, (_, i) => i * 15).map((a) => {
          const [x1, y1] = pt(22, a)
          const [x2, y2] = pt(58, a)
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}

        {/* Points aux sommets */}
        <g fill="currentColor" stroke="none">
          {[15, 45, 75].map((a) => {
            const [x, y] = pt(205, a)
            return <circle key={a} cx={x} cy={y} r="2.6" />
          })}
          {[22.5, 67.5].map((a) => {
            const [x, y] = pt(150, a)
            return <circle key={a} cx={x} cy={y} r="2" />
          })}
        </g>
      </g>
    </svg>
  )
}

export default CercleInvocation
