import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CotizacionCompleta, ServicioItem, Tramo } from "@/types"
import { formatCOP, calcularDuracion } from "@/lib/calculos"

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Disable hyphenation to prevent internal canvas crashes
Font.registerHyphenationCallback((word) => [word])

// Poppins — served from /public/fonts (absolute URL required in browser context)
const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000"

Font.register({
  family: "Poppins",
  fonts: [
    { src: `${origin}/fonts/poppins-regular.ttf`,  fontWeight: 400 },
    { src: `${origin}/fonts/poppins-medium.ttf`,   fontWeight: 500 },
    { src: `${origin}/fonts/poppins-semibold.ttf`, fontWeight: 600 },
  ],
})

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  blue:  "#272F46",     // UI accent
  aqua:  "#00B4C5",     // aquamarine — logo color
  black: "#1C1C1C",
  g1:    "#444444",
  g2:    "#909090",
  g3:    "#DDDDDD",
  bg:    "#F4F4F2",     // warm off-white page background
  band:  "#E6E5E1",     // darker bottom band
  white: "#FFFFFF",
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const S = StyleSheet.create({

  // Page
  page: { fontFamily: "Poppins", backgroundColor: T.bg, padding: 0 },

  // ── White content panel (top ~65% of page) ──
  panel: {
    backgroundColor: T.white,
    marginHorizontal: 36,
    marginTop: 36,
    paddingHorizontal: 36,
    paddingTop: 32,
    paddingBottom: 28,
  },

  // Logo row
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 10 },
  logoTitle: { fontSize: 20, fontWeight: 600, color: T.black, letterSpacing: 1.5 },

  // Bill-to
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },

  clientName: { fontSize: 16, fontWeight: 600, color: T.black, marginBottom: 5 },
  clientMeta: { fontSize: 7.5, fontWeight: 400, color: T.g2, lineHeight: 1.9 },

  agencyRight: { alignItems: "flex-end" },
  agencyName:  { fontSize: 8.5, fontWeight: 600, color: T.black, textAlign: "right" },
  agencyMeta:  { fontSize: 7.5, fontWeight: 400, color: T.g2,    textAlign: "right", lineHeight: 1.9 },

  // Divider
  hr:     { borderBottomWidth: 0.8, borderBottomColor: T.g3, marginBottom: 14 },
  hrThin: { borderBottomWidth: 0.4, borderBottomColor: "#EBEBEB" },

  // Table col-headers (tiny uppercase — exactly like reference)
  colRow: { flexDirection: "row", marginBottom: 8 },
  colH: {
    fontSize: 6.5,
    fontWeight: 500,
    color: T.g2,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  colA: { flex: 3 },
  colB: { flex: 1.4, textAlign: "center" },
  colC: { flex: 1.4, textAlign: "right" },

  // Item row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.4,
    borderBottomColor: "#EBEBEB",
  },
  itemTitle: { fontSize: 9, fontWeight: 500, color: T.black, marginBottom: 2 },
  itemSub:   { fontSize: 7.5, fontWeight: 400, color: T.g2, lineHeight: 1.5 },
  itemMid:   { fontSize: 8, fontWeight: 400, color: T.g1, textAlign: "center" },
  itemVal:   { fontSize: 10, fontWeight: 600, color: T.blue, textAlign: "right" },

  // Section label (inside panel, between groups)
  secLabel: {
    fontSize: 6.5,
    fontWeight: 500,
    color: T.g2,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
  },

  // Services (dash list, 2-col)
  svcGrid: { flexDirection: "row", flexWrap: "wrap" },
  svcItem: {
    width: "50%",
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingRight: 10,
  },
  svcDash: { fontSize: 8, color: T.blue, fontWeight: 600, marginRight: 5 },
  svcText: { fontSize: 8, color: T.g1, flex: 1, lineHeight: 1.5 },
  svcObs:  { fontSize: 6.5, color: T.g2, marginTop: 1 },

  // Per-person line (right-aligned, below panel content)
  perPaxRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    marginTop: 18,
    gap: 12,
  },
  perPaxLabel: { fontSize: 8, color: T.g2, fontWeight: 400 },
  perPaxVal:   { fontSize: 18, fontWeight: 600, color: T.blue },

  // ── Bottom band (gray — exactly like the reference) ──
  band: {
    backgroundColor: T.band,
    marginHorizontal: 36,
    marginTop: 10,
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  bandColRow: { flexDirection: "row", marginBottom: 10 },
  bandColH: {
    fontSize: 6.5,
    fontWeight: 500,
    color: T.g2,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  bandHr: { borderBottomWidth: 0.8, borderBottomColor: "#CBCBC6", marginBottom: 14 },
  bandDataRow: { flexDirection: "row", alignItems: "flex-start" },
  bandC1: { flex: 1.4 },
  bandC2: { flex: 1 },
  bandC3: { flex: 1.4, alignItems: "flex-end" },

  bandSmall: { fontSize: 8, color: T.g1, lineHeight: 1.9 },
  bandBold:  { fontSize: 9, fontWeight: 500, color: T.black },
  bandDate:  { fontSize: 20, fontWeight: 600, color: T.black },
  bandTotal: { fontSize: 26, fontWeight: 600, color: T.blue, textAlign: "right" },
  bandTotalLbl: { fontSize: 7, color: T.g2, textAlign: "right", marginBottom: 3 },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 36,
    marginTop: 12,
    paddingTop: 0,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerHeart: { fontSize: 10, color: T.blue },
  footerTag:   { fontSize: 9, fontWeight: 500, color: T.black },
  footerRight: { fontSize: 7.5, color: T.g2, textAlign: "right", lineHeight: 1.6 },

  // T&C (page 2)
  tc: { fontSize: 7.5, color: T.g1, lineHeight: 1.75, marginBottom: 5 },
})

// ─── Altura real logo mark ───────────────────────────────────────────────────
// SVG viewBox: 686×575 — rendered at ~48×40 in the PDF
const LOGO_PATH =
  "M274.866 2.40356C277.385 4.64385 429.959 284.497 436.638 299.756C430.768 303.016 418.432 307.249 411.842 309.708C398.823 314.552 385.831 319.467 372.867 324.454C323.892 343.421 275.075 362.802 226.421 382.579C205.375 391.099 175.281 401.307 156.185 411.852C177.9 406.414 202.658 400.413 223.588 393.056C251 383.426 278.354 373.016 305.693 363.086L442.521 313.849L500.262 293.37C510.971 289.625 525.122 284.395 535.962 281.61C508.414 296.286 480.967 311.149 453.621 326.194C461.784 344.097 480.254 375.417 490.257 393.634L559.023 519.064C560.44 521.614 563.254 526.159 563.074 528.836C560.051 530.006 450.447 500.366 437.535 497.014C429.421 482.224 421.281 464.884 413.73 449.666L374.539 370.496C363.525 375.401 346.375 385.361 335.415 391.354L264.011 430.624L116.339 510.514C79.9349 530.284 39.9455 553.084 2.96304 571.264C6.89625 562.031 12.6953 550.826 17.1056 541.564L133.097 298.197L213.043 132.043C232.591 90.6936 253.96 42.7985 274.866 2.40356ZM276.812 171.826C275.784 180.241 274.695 209.13 272.278 214.564C253.606 256.53 228.192 301.285 209.914 343.301C220.806 337.076 231.134 330.641 241.886 324.329L294.513 292.827C305.251 286.353 316.866 278.929 327.821 273.042C322.359 261.396 281.008 175.468 276.812 171.826ZM668.917 206.917C673.523 206.475 681.483 206.188 684.236 210.238C684.889 224.047 646.577 243.962 635.204 249.748C629.188 263.464 624.139 277.534 617.98 291.322C613.359 294.451 610.568 296.322 605.489 298.854C604.672 289.822 605.377 273.094 605.497 263.186C594.297 267.266 580.479 271.792 569.586 276.924C565.243 278.971 561.881 286.739 555.077 285.957C553.855 284.909 551.972 277.096 551.192 274.679L532.152 261.848C534.312 260.625 536.488 259.671 538.738 258.632C546.99 259.854 556.255 261.775 564.529 263.294C572.714 258.528 581.303 252.909 589.375 247.847C578.715 241.53 563.734 236.122 552.024 230.197C564.994 223.981 568.775 225.033 583.126 226.975C593.666 228.401 605.265 230.574 615.782 230.94C634.214 219.625 646.944 209.854 668.917 206.917Z"

// Logo mark — aquamarine, header size
function Mark() {
  return (
    <Svg width="52" height="44" viewBox="0 0 686 575">
      <Path d={LOGO_PATH} fill={T.aqua} />
    </Svg>
  )
}

// Watermark — same logo, huge, centered, very faint
// opacity must go on the Path (fill-opacity), not on the View wrapper
function Watermark() {
  const W = 360
  const H = Math.round(W * (575 / 686))  // ~302
  const top  = Math.round((842 - H) / 2)
  const left = Math.round((595 - W) / 2)

  return (
    <View style={{ position: "absolute", top, left, width: W, height: H }}>
      <Svg width={W} height={H} viewBox="0 0 686 575">
        <Path d={LOGO_PATH} fill={T.aqua} fillOpacity={0.07} />
      </Svg>
    </View>
  )
}

// ─── Item row component ───────────────────────────────────────────────────────
function Item({
  title, sub, mid, val, last,
}: {
  title: string
  sub?: string
  mid?: string
  val?: string
  last?: boolean
}) {
  return (
    <View style={[S.itemRow, last ? { borderBottomWidth: 0 } : {}]}>
      <View style={S.colA}>
        <Text style={S.itemTitle}>{title}</Text>
        {sub ? <Text style={S.itemSub}>{sub}</Text> : null}
      </View>
      <View style={S.colB}>
        {mid ? <Text style={S.itemMid}>{mid}</Text> : null}
      </View>
      <View style={S.colC}>
        {val ? <Text style={S.itemVal}>{val}</Text> : null}
      </View>
    </View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CotizacionPDF({ cotizacion }: { cotizacion: CotizacionCompleta }) {
  const duracion   = calcularDuracion(new Date(cotizacion.fechaSalida), new Date(cotizacion.fechaRegreso))
  const totalPax   = cotizacion.adultos + cotizacion.menores
  const activos    = (cotizacion.servicios as ServicioItem[]).filter(s => s.activo)
  const total      = Number(cotizacion.valorConUtilidad ?? cotizacion.valorConPorcentaje ?? 0)
  const perPax     = Number(cotizacion.valorPorPersona  ?? cotizacion.valorNetoIndividual ?? 0)
  const fmtF       = (d: string | Date) => format(new Date(d), "dd/MM/yyyy")
  const fmtFLong   = (d: string | Date) => format(new Date(d), "dd MMM yyyy", { locale: es })

  const plan   = cotizacion.planPagos as { cuotas?: Array<{ numero: number; porcentaje: number; valorTotal: number }> } | null
  const cuotas = plan?.cuotas ?? null
  const mostrar = cotizacion.mostrarPlanPagos !== false && cuotas && cuotas.length > 0

  const hasVuelo  = !!(cotizacion.aerolineaIda ?? cotizacion.aerolinea ?? cotizacion.horaSalidaIda)
  const hasHotel  = !!cotizacion.hotelNombre
  const hasTramos = Array.isArray(cotizacion.tramos) && cotizacion.tramos.length > 0

  // Build sub-lines for flights
  const vueloIdaSub = [
    cotizacion.aerolineaIda ?? cotizacion.aerolinea,
    cotizacion.plataforma,
    cotizacion.horaSalidaIda && cotizacion.horaLlegadaIda
      ? `${cotizacion.horaSalidaIda} → ${cotizacion.horaLlegadaIda}`
      : null,
    cotizacion.tiempoVuelo,
    cotizacion.escalas ? `Esc: ${cotizacion.escalas}` : null,
  ].filter(Boolean).join("  ·  ")

  const vueloRetSub = [
    cotizacion.aerolineaRegreso,
    cotizacion.horaSalidaRegreso && cotizacion.horaLlegadaRegreso
      ? `${cotizacion.horaSalidaRegreso} → ${cotizacion.horaLlegadaRegreso}`
      : null,
  ].filter(Boolean).join("  ·  ")

  return (
    <Document title={`Cotización ${cotizacion.codigo}`} author="Altura Agencia de Viajes">

      {/* ══════════════════ PÁGINA 1 ══════════════════ */}
      <Page size="A4" style={S.page}>

        {/* White panel */}
        <View style={S.panel}>

          {/* Logo + título */}
          <View style={S.logoRow}>
            <Mark />
            <Text style={S.logoTitle}>COTIZACIÓN DE VIAJE</Text>
          </View>

          {/* Cliente ↔ Agencia */}
          <View style={S.billRow}>
            <View>
              <Text style={S.clientName}>{cotizacion.cliente.nombre}</Text>
              <Text style={S.clientMeta}>
                {"Fecha:  "}{format(new Date(cotizacion.fechaCreacion), "dd 'de' MMMM, yyyy", { locale: es })}
                {"\nCódigo:  "}{cotizacion.codigo}
                {cotizacion.cliente.telefono ? `\nTel:  ${cotizacion.cliente.telefono}` : ""}
                {cotizacion.cliente.correo   ? `\n${cotizacion.cliente.correo}` : ""}
              </Text>
            </View>
            <View style={S.agencyRight}>
              <Text style={S.agencyName}>ALTURA Agencia de Viajes</Text>
              <Text style={S.agencyMeta}>
                {"Cristian Camilo Correa Vanegas\n"}
                {"304 208 6768  ·  323 726 1564"}
              </Text>
            </View>
          </View>

          {/* Table */}
          <View style={S.hr} />
          <View style={S.colRow}>
            <View style={S.colA}><Text style={S.colH}>Descripción</Text></View>
            <View style={S.colB}><Text style={[S.colH, { textAlign: "center" }]}>Fechas</Text></View>
            <View style={S.colC}><Text style={[S.colH, { textAlign: "right" }]}>Valor / pax</Text></View>
          </View>
          <View style={S.hrThin} />

          {/* Destino */}
          <Item
            title={`${cotizacion.origen}  →  ${cotizacion.destino}`}
            sub={`${duracion.label}  ·  ${totalPax} pasajero${totalPax !== 1 ? "s" : ""}  ·  ${cotizacion.adultos} adulto${cotizacion.adultos !== 1 ? "s" : ""}${cotizacion.menores > 0 ? `, ${cotizacion.menores} menor${cotizacion.menores !== 1 ? "es" : ""}` : ""}${cotizacion.edadesMenores?.length ? `  (${cotizacion.edadesMenores.map((e, i) => `M${i + 1}: ${e}a`).join(", ")})` : ""}`}
            mid={`${fmtF(cotizacion.fechaSalida)}\n${fmtF(cotizacion.fechaRegreso)}`}
          />

          {/* Vuelo ida */}
          {hasVuelo && (
            <Item
              title={`Vuelo ida  —  ${cotizacion.origen} → ${cotizacion.destino}`}
              sub={vueloIdaSub || undefined}
            />
          )}

          {/* Vuelo regreso */}
          {hasVuelo && vueloRetSub && (
            <Item
              title={`Vuelo regreso  —  ${cotizacion.destino} → ${cotizacion.origen}`}
              sub={vueloRetSub}
            />
          )}

          {/* Tramos */}
          {hasTramos && (cotizacion.tramos as Tramo[]).map((t) => {
            const sub = [
              t.aerolineaIda,
              t.plataforma,
              t.horaSalidaIda && t.horaLlegadaIda ? `${t.horaSalidaIda} → ${t.horaLlegadaIda}` : null,
              t.tiempoVuelo,
              t.escalas ? `Esc: ${t.escalas}` : null,
            ].filter(Boolean).join("  ·  ")
            return (
              <Item
                key={t.id}
                title={`Tramo  —  ${t.origen || "—"} → ${t.destino || "—"}`}
                sub={sub || undefined}
                mid={t.fechaSalida ? fmtF(t.fechaSalida) : undefined}
              />
            )
          })}

          {/* Hotel */}
          {hasHotel && (
            <Item
              title={`Alojamiento  —  ${cotizacion.hotelNombre}`}
              sub={[
                cotizacion.hotelTipo,
                cotizacion.hotelNoches ? `${cotizacion.hotelNoches} noche${cotizacion.hotelNoches !== 1 ? "s" : ""}` : null,
              ].filter(Boolean).join("  ·  ") || undefined}
            />
          )}

          {/* Servicios */}
          {activos.length > 0 && (
            <>
              <Text style={S.secLabel}>Servicios incluidos</Text>
              <View style={S.svcGrid}>
                {activos.map(sv => (
                  <View key={sv.id} style={S.svcItem}>
                    <Text style={S.svcDash}>—</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={S.svcText}>{sv.nombre}</Text>
                      {sv.obs ? <Text style={S.svcObs}>{sv.obs}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Valor por persona */}
          <View style={S.perPaxRow}>
            <Text style={S.perPaxLabel}>Valor por persona</Text>
            <Text style={S.perPaxVal}>{formatCOP(perPax)}</Text>
          </View>

        </View>
        {/* end white panel */}

        {/* ── Gray band (like reference bottom section) ── */}
        <View style={S.band}>
          <View style={S.bandColRow}>
            <View style={S.bandC1}>
              <Text style={S.bandColH}>{mostrar ? "Plan de pagos" : "Pago"}</Text>
            </View>
            <View style={S.bandC2}>
              <Text style={S.bandColH}>Vigencia</Text>
            </View>
            <View style={S.bandC3}>
              <Text style={[S.bandColH, { textAlign: "right" }]}>Total</Text>
            </View>
          </View>
          <View style={S.bandHr} />

          <View style={S.bandDataRow}>
            {/* Cuotas or single */}
            <View style={S.bandC1}>
              {mostrar && cuotas
                ? cuotas.map(c => (
                  <Text key={c.numero} style={S.bandSmall}>
                    {"Cuota "}{c.numero}{"  ("}{c.porcentaje}{"%)\n"}
                    <Text style={S.bandBold}>{formatCOP(c.valorTotal)}</Text>
                    {"\n\n"}
                  </Text>
                ))
                : <Text style={S.bandSmall}>Pago único</Text>
              }
            </View>

            {/* Vigencia */}
            <View style={S.bandC2}>
              <Text style={S.bandDate}>24 h</Text>
              <Text style={[S.bandSmall, { marginTop: 3 }]}>{"desde la\nemisión"}</Text>
            </View>

            {/* Total */}
            <View style={S.bandC3}>
              <Text style={S.bandTotalLbl}>Valor total</Text>
              <Text style={S.bandTotal}>{formatCOP(total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <View style={S.footerLeft}>
            <Svg width="10" height="10" viewBox="0 0 32 32">
              <Path
                d="M16 28 C16 28 3 19 3 10.5 C3 6.4 6.4 3 10.5 3 C13 3 15.2 4.2 16 6 C16.8 4.2 19 3 21.5 3 C25.6 3 29 6.4 29 10.5 C29 19 16 28 16 28Z"
                fill={T.aqua}
              />
            </Svg>
            <Text style={S.footerTag}>Ven y viaja con Altura</Text>
          </View>
          <Text style={S.footerRight}>{"304 208 6768  ·  323 726 1564"}</Text>
        </View>
        <Watermark />

      </Page>

      {/* ══════════════════ PÁGINA 2 — T&C ══════════════════ */}
      <Page size="A4" style={S.page}>

        <View style={S.panel}>

          {/* Mini logo header */}
          <View style={[S.logoRow, { marginBottom: 20 }]}>
            <Mark />
            <View>
              <Text style={{ fontSize: 13, fontWeight: 600, color: T.black, letterSpacing: 0.5 }}>
                Términos y Condiciones
              </Text>
              <Text style={{ fontSize: 7.5, color: T.g2, marginTop: 2 }}>
                {cotizacion.codigo}  ·  {cotizacion.cliente.nombre}
              </Text>
            </View>
          </View>

          <View style={S.hr} />

          {[
            "Tarifas sujetas a disponibilidad y cambios sin previo aviso.",
            "No incluye servicios no especificados en esta cotización.",
            "En caso de cancelación o modificación del viaje, el cliente asumirá el costo total del nuevo tiquete o la penalidad que aplique la aerolínea.",
            "Esta agencia no se responsabiliza por variaciones tarifarias ajenas a su control.",
            "Servicios extras como maletas adicionales o visas se cotizan aparte.",
            "Los precios cotizados son válidos por 24 horas desde la fecha de emisión.",
            "El plan de pagos acordado deberá respetarse para mantener la reserva activa.",
            "En caso de no pago oportuno, la reserva podrá ser cancelada sin reembolso.",
            "ALTURA Agencia de Viajes actúa como intermediario entre el cliente y los proveedores de servicios turísticos.",
            "Cualquier reclamo por servicios de terceros (aerolíneas, hoteles) deberá gestionarse directamente con el proveedor.",
          ].map((c, i) => (
            <Text key={i} style={S.tc}>{i + 1}.{"  "}{c}</Text>
          ))}

          {cotizacion.observaciones && (
            <View style={{ marginTop: 20 }}>
              <View style={S.hr} />
              <Text style={[S.secLabel, { marginTop: 0 }]}>Observaciones</Text>
              <Text style={{ fontSize: 8.5, color: T.g1, lineHeight: 1.7 }}>
                {cotizacion.observaciones}
              </Text>
            </View>
          )}

          {/* Contacto */}
          <View style={{ marginTop: 32, borderTopWidth: 0.8, borderTopColor: T.g3, paddingTop: 18 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: T.black, marginBottom: 5 }}>
              Cristian Camilo Correa Vanegas
            </Text>
            <Text style={{ fontSize: 8, color: T.g1 }}>
              Representante Legal — ALTURA Agencia de Viajes
            </Text>
            <Text style={{ fontSize: 8, color: T.g2, marginTop: 3 }}>
              304 208 6768  ·  323 726 1564
            </Text>
          </View>

        </View>

        {/* Band */}
        <View style={[S.band, { paddingVertical: 16 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 7.5, color: T.g1 }}>
              Documento generado por ALTURA Agencia de Viajes
            </Text>
            <Text style={{ fontSize: 7.5, color: T.g2 }}>{cotizacion.codigo}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <View style={S.footerLeft}>
            <Svg width="10" height="10" viewBox="0 0 32 32">
              <Path
                d="M16 28 C16 28 3 19 3 10.5 C3 6.4 6.4 3 10.5 3 C13 3 15.2 4.2 16 6 C16.8 4.2 19 3 21.5 3 C25.6 3 29 6.4 29 10.5 C29 19 16 28 16 28Z"
                fill={T.aqua}
              />
            </Svg>
            <Text style={S.footerTag}>Ven y viaja con Altura</Text>
          </View>
          <Text style={S.footerRight}>{"304 208 6768  ·  323 726 1564"}</Text>
        </View>
        <Watermark />

      </Page>
    </Document>
  )
}
