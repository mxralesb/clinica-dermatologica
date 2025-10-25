// Simple logotipo HistoMed (icono + wordmark) en SVG
export default function AuthLogo({ light = true }) {
  const fg = light ? '#E6F0FF' : '#0B1526'
  const accent = '#2EC4C7' // celeste del botón
  return (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={accent}/>
            <stop offset="1" stopColor="#2AA9B0"/>
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#g)"/>
        {/* cruz médica */}
        <rect x="28" y="16" width="8" height="32" rx="2" fill="#0B1526" opacity=".9"/>
        <rect x="16" y="28" width="32" height="8" rx="2" fill="#0B1526" opacity=".9"/>
      </svg>
      <span style={{fontSize:28,fontWeight:700,color:fg,lineHeight:1}}>HistoMed</span>
    </div>
  )
}
