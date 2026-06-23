interface AlturaLogoProps {
  size?: "sm" | "md" | "lg"
}

export function AlturaLogo({ size = "md" }: AlturaLogoProps) {
  const logoH = { sm: 24, md: 30, lg: 40 }[size]
  const nameSize = { sm: "text-sm",  md: "text-base", lg: "text-lg"  }[size]
  const subSize  = { sm: "text-[7px]", md: "text-[8px]", lg: "text-[9px]" }[size]

  return (
    <div className="flex items-center gap-2.5">
      {/* Real Altura SVG logo — aquamarine */}
      <img
        src="/logo.svg"
        alt="Altura"
        height={logoH}
        style={{ height: logoH, width: "auto" }}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${nameSize} font-semibold text-foreground tracking-[0.12em]`}
        >
          ALTURA
        </span>
        <span
          className={`${subSize} text-muted-foreground tracking-[0.22em] mt-0.5`}
        >
          AGENCIA DE VIAJES
        </span>
      </div>
    </div>
  )
}
