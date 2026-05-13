export function AlturaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 100, md: 140, lg: 180 }
  const w = sizes[size]

  return (
    <svg viewBox="0 0 180 48" width={w} xmlns="http://www.w3.org/2000/svg">
      <text
        x="4"
        y="34"
        fontFamily="Playfair Display, serif"
        fontSize="30"
        fontWeight="700"
        fill="#C9922A"
        letterSpacing="5"
      >
        ALTURA
      </text>
      <path
        d="M156 6 L172 2 L167 13 L160 11 Z M160 11 L165 20 L162 19 Z M156 6 L153 12 L159 12 Z"
        fill="#C9922A"
        opacity="0.9"
      />
      <line x1="4" y1="39" x2="176" y2="39" stroke="#C9922A" strokeWidth="0.8" opacity="0.35" />
      <text
        x="4"
        y="47"
        fontFamily="Inter, sans-serif"
        fontSize="7.5"
        fill="#8B6520"
        letterSpacing="3.5"
      >
        AGENCIA DE VIAJES
      </text>
    </svg>
  )
}
