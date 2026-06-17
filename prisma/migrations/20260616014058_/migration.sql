-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "asistentes_confirmados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "es_de_paga" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precio" DECIMAL(10,2),
ADD COLUMN     "total_invitados" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "profesores" ADD COLUMN     "horario_pdf" TEXT;

-- AlterTable
ALTER TABLE "rutas" ADD COLUMN     "contador_usos" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "invitado_eventos" (
    "id_invitado" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "correo" TEXT NOT NULL,
    "asistencia" BOOLEAN NOT NULL DEFAULT false,
    "monto_pagado" DECIMAL(10,2),
    "metodo_pago" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitado_eventos_pkey" PRIMARY KEY ("id_invitado")
);

-- CreateIndex
CREATE INDEX "invitado_eventos_id_evento_idx" ON "invitado_eventos"("id_evento");

-- AddForeignKey
ALTER TABLE "invitado_eventos" ADD CONSTRAINT "invitado_eventos_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;
