-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('COTIZADA', 'NEGOCIACION', 'APROBADA', 'PAGANDO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoViaje" AS ENUM ('NACIONAL', 'INTERNACIONAL');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "documento" TEXT,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'COTIZADA',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoViaje" NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL,
    "fechaRegreso" TIMESTAMP(3) NOT NULL,
    "aerolinea" TEXT,
    "numeroVuelo" TEXT,
    "adultos" INTEGER NOT NULL DEFAULT 1,
    "menores" INTEGER NOT NULL DEFAULT 0,
    "edadesMenores" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "servicios" JSONB NOT NULL,
    "itinerario" JSONB,
    "porcentajeGanancia" DECIMAL(65,30) NOT NULL,
    "valorNetoIndividual" DECIMAL(65,30) NOT NULL,
    "valorNetoTotal" DECIMAL(65,30) NOT NULL,
    "gananciaTotal" DECIMAL(65,30) NOT NULL,
    "valorConPorcentaje" DECIMAL(65,30) NOT NULL,
    "planPagos" JSONB NOT NULL,
    "asistenciaMedica" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_codigo_key" ON "cotizaciones"("codigo");

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
