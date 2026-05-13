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
import { CotizacionCompleta } from "@/types"
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

  return (
    <Document
      title={`Cotización ${cotizacion.codigo}`}
      author="Altura Agencia de Viajes"
    >
      {/* PÁGINA 1 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text
            style={{
              color: "#C9922A",
              fontSize: 28,
              fontFamily: "Playfair",
              letterSpacing: 6,
            }}
          >
            ALTURA
          </Text>
          <Text
            style={{
              color: "#8B6520",
              fontSize: 7,
              letterSpacing: 4,
              marginTop: 2,
            }}
          >
            AGENCIA DE VIAJES
          </Text>
          <Text
            style={{
              color: "#C9922A",
              fontSize: 14,
              fontFamily: "Playfair",
              marginTop: 8,
              letterSpacing: 2,
            }}
          >
            Cotización de Viaje
          </Text>
        </View>

        <View style={styles.body}>
          {/* Meta */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Fecha:{" "}
              {format(new Date(cotizacion.fechaCreacion), "dd MMMM yyyy", {
                locale: es,
              })}
            </Text>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Cliente: {cotizacion.cliente.nombre}
            </Text>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Teléfono: {cotizacion.cliente.telefono}
            </Text>
            <Text style={{ fontSize: 8, color: "#5F5E5A" }}>
              Código: {cotizacion.codigo}
            </Text>
          </View>

          {/* Detalles del Viaje */}
          <Text style={styles.sectionTitle}>Detalles del Viaje</Text>
          <View style={styles.sectionLine} />
          <View style={styles.table}>
            {[
              ["Destinos", `${cotizacion.origen} → ${cotizacion.destino}`],
              [
                "Fecha de salida",
                format(new Date(cotizacion.fechaSalida), "dd/MM/yyyy"),
              ],
              [
                "Fecha de regreso",
                format(new Date(cotizacion.fechaRegreso), "dd/MM/yyyy"),
              ],
              ["Duración", duracion.label],
              [
                "Pasajeros",
                `${cotizacion.adultos} Adulto(s)${cotizacion.menores > 0 ? `, ${cotizacion.menores} Menor(es)` : ""}`,
              ],
              ["Aerolínea", cotizacion.aerolinea || "Por confirmar"],
            ].map(([label, value]) => (
              <View key={label} style={styles.row}>
                <View style={styles.col50}>
                  <Text style={styles.tdLabel}>{label}</Text>
                </View>
                <View style={styles.col50}>
                  <Text style={styles.tdValue}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Servicios */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Servicios Incluidos</Text>
            <View style={styles.sectionLine} />
            {cotizacion.servicios
              .filter((s) => s.activo)
              .map((s) => (
                <Text key={s.id} style={styles.check}>
                  ✓  {s.nombre}
                  {s.obs ? ` — ${s.obs}` : ""}
                </Text>
              ))}
          </View>

          {/* Valores */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Valor</Text>
            <View style={styles.sectionLine} />
            <View style={styles.table}>
              {[
                [
                  "Valor por persona",
                  formatCOP(Number(cotizacion.valorNetoIndividual)),
                ],
                [
                  "Total pasajeros",
                  `${cotizacion.adultos + cotizacion.menores} persona(s)`,
                ],
              ].map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <View style={styles.col50}>
                    <Text style={styles.tdLabel}>{label}</Text>
                  </View>
                  <View style={styles.col50}>
                    <Text style={styles.tdValue}>{value}</Text>
                  </View>
                </View>
              ))}
              <View style={{ ...styles.row, ...styles.totalRow }}>
                <View style={styles.col50}>
                  <Text style={styles.totalText}>Valor Total</Text>
                </View>
                <View style={styles.col50}>
                  <Text style={styles.totalText}>
                    {formatCOP(Number(cotizacion.valorConPorcentaje))}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Plan de pagos */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Plan de Pagos</Text>
            <View style={styles.sectionLine} />
            <View style={styles.table}>
              <View style={styles.row}>
                {["Cuota", "V. Unitario", "V. Total", "%"].map((h) => (
                  <View key={h} style={{ flex: 1 }}>
                    <Text style={styles.thCell}>{h}</Text>
                  </View>
                ))}
              </View>
              {(["pago1", "pago2", "pago3"] as const).map((key, i) => {
                const p = cotizacion.planPagos[key]
                return (
                  <View key={key} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tdLabel}>Pago {i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tdValue}>
                        {formatCOP(p.valorIndividual)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tdValue}>
                        {formatCOP(p.valorTotal)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tdValue}>{p.porcentaje}%</Text>
                    </View>
                  </View>
                )
              })}
              <View style={{ ...styles.row, ...styles.totalRow }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalText}>TOTAL</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalText}>
                    {formatCOP(Number(cotizacion.valorConPorcentaje))}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalText}>100%</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.tagline}>Ven y viaja con Altura</Text>
        </View>
      </Page>

      {/* PÁGINA 2 — Condiciones */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text
            style={{
              color: "#C9922A",
              fontSize: 22,
              fontFamily: "Playfair",
              letterSpacing: 5,
            }}
          >
            ALTURA
          </Text>
          <Text
            style={{
              color: "#8B6520",
              fontSize: 7,
              letterSpacing: 4,
              marginTop: 2,
            }}
          >
            AGENCIA DE VIAJES
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Condiciones</Text>
          <View style={styles.sectionLine} />
          {[
            "Tarifas sujetas a disponibilidad y cambios sin previo aviso.",
            "No incluye servicios no especificados.",
            "En caso de cancelación o modificación del viaje, el cliente asumirá el costo total del nuevo tiquete o penalidad que aplique la aerolínea.",
            "Esta agencia no se responsabiliza por variaciones tarifarias ajenas.",
            "Cualquier servicio extra, como maletas adicionales, se cotiza aparte.",
          ].map((c, i) => (
            <Text
              key={i}
              style={{
                fontSize: 8.5,
                color: "#2C2C2A",
                marginBottom: 6,
                lineHeight: 1.5,
              }}
            >
              • {c}
            </Text>
          ))}

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.sectionLine} />
            <Text
              style={{
                fontSize: 9,
                color: "#0D2B4E",
                fontFamily: "Helvetica-Bold",
              }}
            >
              Cristian Camilo Correa Vanegas
            </Text>
            <Text
              style={{ fontSize: 8.5, color: "#5F5E5A", marginTop: 3 }}
            >
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
