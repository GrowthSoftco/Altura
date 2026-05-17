import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CotizacionCompleta, Tramo } from "@/types"
import { formatCOP, calcularDuracion } from "@/lib/calculos"

Font.register({
  family: "Playfair",
  src: "/fonts/playfair-display-bold.ttf",
  fontWeight: 700,
})

const styles = StyleSheet.create({
  page:         { fontFamily: "Helvetica", backgroundColor: "#FFFFFF", padding: 0 },
  header:       { backgroundColor: "#0D2B4E", padding: 28, alignItems: "center" },
  body:         { padding: "20 30" },
  sectionTitle: {
    color: "#C9922A",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  sectionLine:  { borderBottomWidth: 0.5, borderBottomColor: "#F5E6C8", marginBottom: 12 },
  table:        { borderWidth: 0.5, borderColor: "#E8EBF0", borderRadius: 4 },
  thCell:       {
    backgroundColor: "#0D2B4E",
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    padding: 7,
  },
  tdLabel:      {
    backgroundColor: "#F4F6F9",
    color: "#5F5E5A",
    fontSize: 8,
    padding: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E8EBF0",
  },
  tdValue:      {
    color: "#1A1A1A",
    fontSize: 8,
    padding: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E8EBF0",
  },
  totalRow:     { backgroundColor: "#0D2B4E" },
  totalText:    { color: "#C9922A", fontFamily: "Helvetica-Bold", fontSize: 9, padding: 8 },
  tagline:      {
    color: "#C9922A",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
  check:        { color: "#3B6D11", fontSize: 9, marginBottom: 3 },
  row:          { flexDirection: "row" },
  col50:        { width: "50%" },
})

export function CotizacionPDF({ cotizacion }: { cotizacion: CotizacionCompleta }) {
  const duracion = calcularDuracion(
    new Date(cotizacion.fechaSalida),
    new Date(cotizacion.fechaRegreso)
  )

  const totalPax = cotizacion.adultos + cotizacion.menores

  // Resolve plan de pagos — support both old and new formats
  const planPagos = cotizacion.planPagos
  const cuotas = planPagos && "cuotas" in planPagos && Array.isArray((planPagos as { cuotas: unknown[] }).cuotas)
    ? (planPagos as { cuotas: Array<{ numero: number; porcentaje: number; valorTotal: number }> }).cuotas
    : null

  return (
    <Document
      title={`Cotización ${cotizacion.codigo}`}
      author="Altura Agencia de Viajes"
    >
      {/* PÁGINA 1 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ color: "#C9922A", fontSize: 28, fontFamily: "Playfair", letterSpacing: 6 }}>
            ALTURA
          </Text>
          <Text style={{ color: "#8B6520", fontSize: 7, letterSpacing: 4, marginTop: 2 }}>
            AGENCIA DE VIAJES
          </Text>
          <Text style={{ color: "#C9922A", fontSize: 14, fontFamily: "Playfair", marginTop: 8, letterSpacing: 2 }}>
            Cotización de Viaje
          </Text>
        </View>

        <View style={styles.body}>
          {/* Meta */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Fecha: {format(new Date(cotizacion.fechaCreacion), "dd MMMM yyyy", { locale: es })}
            </Text>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Cliente: {cotizacion.cliente.nombre}
            </Text>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Teléfono: {cotizacion.cliente.telefono}
            </Text>
            {cotizacion.cliente.correo && (
              <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
                Correo: {cotizacion.cliente.correo}
              </Text>
            )}
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Código: {cotizacion.codigo}
            </Text>
          </View>

          {/* Detalles del Viaje */}
          <Text style={styles.sectionTitle}>Detalles del Viaje</Text>
          <View style={styles.sectionLine} />
          <View style={styles.table}>
            {([
              ["Destino", `${cotizacion.origen} → ${cotizacion.destino}`],
              ["Fecha de salida", format(new Date(cotizacion.fechaSalida), "dd/MM/yyyy")],
              ["Fecha de regreso", format(new Date(cotizacion.fechaRegreso), "dd/MM/yyyy")],
              ["Duración", duracion.label],
              ["Pasajeros", `${cotizacion.adultos} Adulto(s)${cotizacion.menores > 0 ? `, ${cotizacion.menores} Menor(es)` : ""}`],
            ] as [string, string][]).map(([label, value]) => (
              <View key={label} style={styles.row}>
                <View style={styles.col50}><Text style={styles.tdLabel}>{label}</Text></View>
                <View style={styles.col50}><Text style={styles.tdValue}>{value}</Text></View>
              </View>
            ))}
            {cotizacion.edadesMenores && cotizacion.edadesMenores.length > 0 && (
              <View style={styles.row}>
                <View style={styles.col50}><Text style={styles.tdLabel}>Edades de menores</Text></View>
                <View style={styles.col50}>
                  <Text style={styles.tdValue}>{cotizacion.edadesMenores.map((e, i) => `M${i+1}: ${e} años`).join(", ")}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Itinerario de Vuelo */}
          {(cotizacion.aerolineaIda || cotizacion.aerolinea || cotizacion.horaSalidaIda || cotizacion.plataforma) && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Itinerario de Vuelo</Text>
              <View style={styles.sectionLine} />
              <View style={styles.table}>
                {([
                  ["Aerolínea ida", cotizacion.aerolineaIda ?? cotizacion.aerolinea ?? ""],
                  cotizacion.aerolineaRegreso ? ["Aerolínea regreso", cotizacion.aerolineaRegreso] : null,
                  cotizacion.plataforma ? ["Plataforma", cotizacion.plataforma] : null,
                  cotizacion.horaSalidaIda ? ["Salida (ida)", cotizacion.horaSalidaIda] : null,
                  cotizacion.horaLlegadaIda ? ["Llegada (ida)", cotizacion.horaLlegadaIda] : null,
                  cotizacion.horaSalidaRegreso ? ["Salida (regreso)", cotizacion.horaSalidaRegreso] : null,
                  cotizacion.horaLlegadaRegreso ? ["Llegada (regreso)", cotizacion.horaLlegadaRegreso] : null,
                  cotizacion.tiempoVuelo ? ["Tiempo de vuelo", cotizacion.tiempoVuelo] : null,
                  cotizacion.escalas ? ["Escalas", cotizacion.escalas] : null,
                  cotizacion.tiempoEscala ? ["Tiempo de escala", cotizacion.tiempoEscala] : null,
                ] as ([string, string] | null)[]).filter((r): r is [string, string] => r !== null && !!r[1]).map(([label, value]) => (
                  <View key={label} style={styles.row}>
                    <View style={styles.col50}><Text style={styles.tdLabel}>{label}</Text></View>
                    <View style={styles.col50}><Text style={styles.tdValue}>{value}</Text></View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tramos adicionales */}
          {cotizacion.tramos && cotizacion.tramos.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Tramos Adicionales</Text>
              <View style={styles.sectionLine} />
              {cotizacion.tramos.map((tramo: Tramo, idx: number) => (
                <View key={tramo.id} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0D2B4E", marginBottom: 4 }}>
                    Tramo {idx + 1}: {tramo.origen} → {tramo.destino}
                  </Text>
                  <View style={styles.table}>
                    {([
                      tramo.aerolineaIda ? ["Aerolínea ida", tramo.aerolineaIda] : null,
                      tramo.aerolineaRegreso ? ["Aerolínea regreso", tramo.aerolineaRegreso] : null,
                      tramo.fechaSalida ? ["Fecha salida", tramo.fechaSalida] : null,
                      tramo.fechaRegreso ? ["Fecha regreso", tramo.fechaRegreso] : null,
                      tramo.horaSalidaIda ? ["Hora salida", tramo.horaSalidaIda] : null,
                      tramo.horaLlegadaIda ? ["Hora llegada", tramo.horaLlegadaIda] : null,
                      tramo.escalas ? ["Escalas", tramo.escalas] : null,
                      tramo.plataforma ? ["Plataforma", tramo.plataforma] : null,
                    ] as ([string, string] | null)[]).filter((r): r is [string, string] => r !== null).map(([label, value]) => (
                      <View key={label} style={styles.row}>
                        <View style={styles.col50}><Text style={styles.tdLabel}>{label}</Text></View>
                        <View style={styles.col50}><Text style={styles.tdValue}>{value}</Text></View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Hotel */}
          {cotizacion.hotelNombre && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Alojamiento</Text>
              <View style={styles.sectionLine} />
              <View style={styles.table}>
                {([
                  ["Hotel", cotizacion.hotelNombre],
                  cotizacion.hotelNoches ? ["Noches", String(cotizacion.hotelNoches)] : null,
                  cotizacion.hotelTipo ? ["Tipo de habitación", cotizacion.hotelTipo] : null,
                ] as ([string, string] | null)[]).filter((r): r is [string, string] => r !== null).map(([label, value]) => (
                  <View key={label} style={styles.row}>
                    <View style={styles.col50}><Text style={styles.tdLabel}>{label}</Text></View>
                    <View style={styles.col50}><Text style={styles.tdValue}>{value}</Text></View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Servicios */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Servicios Incluidos</Text>
            <View style={styles.sectionLine} />
            {cotizacion.servicios
              .filter(s => s.activo)
              .map(s => (
                <Text key={s.id} style={styles.check}>
                  ✓  {s.nombre}{s.obs ? ` — ${s.obs}` : ""}
                </Text>
              ))}
          </View>

          {/* Valores */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Valor</Text>
            <View style={styles.sectionLine} />
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={styles.col50}><Text style={styles.tdLabel}>Valor por persona</Text></View>
                <View style={styles.col50}>
                  <Text style={styles.tdValue}>
                    {formatCOP(Number(cotizacion.valorPorPersona ?? cotizacion.valorNetoIndividual ?? 0))}
                  </Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col50}><Text style={styles.tdLabel}>Total pasajeros</Text></View>
                <View style={styles.col50}><Text style={styles.tdValue}>{totalPax} persona(s)</Text></View>
              </View>
              <View style={{ ...styles.row, ...styles.totalRow }}>
                <View style={styles.col50}><Text style={styles.totalText}>Valor Total</Text></View>
                <View style={styles.col50}>
                  <Text style={styles.totalText}>
                    {formatCOP(Number(cotizacion.valorConUtilidad ?? cotizacion.valorConPorcentaje ?? 0))}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Plan de pagos */}
          {cotizacion.mostrarPlanPagos !== false && cuotas && cuotas.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Plan de Pagos</Text>
              <View style={styles.sectionLine} />
              <View style={styles.table}>
                <View style={styles.row}>
                  {["Cuota", "Porcentaje", "Valor Total"].map(h => (
                    <View key={h} style={{ flex: 1 }}>
                      <Text style={styles.thCell}>{h}</Text>
                    </View>
                  ))}
                </View>
                {cuotas.map(c => (
                  <View key={c.numero} style={styles.row}>
                    <View style={{ flex: 1 }}><Text style={styles.tdLabel}>Cuota {c.numero}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.tdValue}>{c.porcentaje}%</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.tdValue}>{formatCOP(c.valorTotal)}</Text></View>
                  </View>
                ))}
                <View style={{ ...styles.row, ...styles.totalRow }}>
                  <View style={{ flex: 1 }}><Text style={styles.totalText}>TOTAL</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.totalText}>100%</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalText}>
                      {formatCOP(Number(cotizacion.valorConUtilidad ?? cotizacion.valorConPorcentaje ?? 0))}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 7, color: "#8B8B8B", marginTop: 4 }}>
                * Los valores pueden variar por cambios de temporada o disponibilidad.
              </Text>
            </View>
          )}

          {/* Observaciones */}
          {cotizacion.observaciones && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Observaciones</Text>
              <View style={styles.sectionLine} />
              <Text style={{ fontSize: 8.5, color: "#2C2C2A", lineHeight: 1.5 }}>{cotizacion.observaciones}</Text>
            </View>
          )}

          <Text style={styles.tagline}>Ven y viaja con Altura</Text>
        </View>
      </Page>

      {/* PÁGINA 2 — Condiciones */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ color: "#C9922A", fontSize: 22, fontFamily: "Playfair", letterSpacing: 5 }}>
            ALTURA
          </Text>
          <Text style={{ color: "#8B6520", fontSize: 7, letterSpacing: 4, marginTop: 2 }}>
            AGENCIA DE VIAJES
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
          <View style={styles.sectionLine} />
          {[
            "Tarifas sujetas a disponibilidad y cambios sin previo aviso.",
            "No incluye servicios no especificados en esta cotización.",
            "En caso de cancelación o modificación del viaje, el cliente asumirá el costo total del nuevo tiquete o penalidad que aplique la aerolínea.",
            "Esta agencia no se responsabiliza por variaciones tarifarias ajenas a su control.",
            "Cualquier servicio extra, como maletas adicionales o visas, se cotiza aparte.",
            "Los precios cotizados son válidos por 24 horas desde la fecha de emisión.",
            "El plan de pagos acordado deberá respetarse para mantener la reserva activa.",
            "En caso de no pago oportuno, la reserva podrá ser cancelada sin reembolso.",
            "ALTURA Agencia de Viajes actúa como intermediario entre el cliente y los proveedores de servicios turísticos.",
            "Cualquier reclamo por servicios prestados por terceros (aerolíneas, hoteles) deberá gestionarse directamente con el proveedor.",
          ].map((c, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: "#2C2C2A", marginBottom: 6, lineHeight: 1.5 }}>
              {i + 1}. {c}
            </Text>
          ))}

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.sectionLine} />
            <Text style={{ fontSize: 9, color: "#0D2B4E", fontFamily: "Helvetica-Bold" }}>
              Cristian Camilo Correa Vanegas
            </Text>
            <Text style={{ fontSize: 8.5, color: "#5F5E5A", marginTop: 3 }}>
              Representante Legal — ALTURA Agencia de Viajes
            </Text>
            <Text style={{ fontSize: 8.5, color: "#5F5E5A", marginTop: 2 }}>
              Tel. 304 208 6768 — 323 726 1564
            </Text>
          </View>
        </View>
        <Text style={styles.tagline}>Ven y viaja con Altura</Text>
      </Page>
    </Document>
  )
}
