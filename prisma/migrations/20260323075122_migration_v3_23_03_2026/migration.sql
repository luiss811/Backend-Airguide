-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'alumno');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('pendiente', 'activo', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoEdificio" AS ENUM ('academico', 'administrativo', 'recreativo');

-- CreateEnum
CREATE TYPE "TipoSalon" AS ENUM ('aula', 'laboratorio', 'auditorio');

-- CreateEnum
CREATE TYPE "TipoRuta" AS ENUM ('interna', 'externa');

-- CreateEnum
CREATE TYPE "TipoOrigen" AS ENUM ('edificio', 'salon', 'cubiculo', 'evento');

-- CreateEnum
CREATE TYPE "TipoDestino" AS ENUM ('edificio', 'salon', 'cubiculo', 'evento');

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "matricula" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'pendiente',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_validacion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "edificios" (
    "id_edificio" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "latitud" DECIMAL(10,8) NOT NULL,
    "longitud" DECIMAL(11,8) NOT NULL,
    "tipo" "TipoEdificio" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "edificios_pkey" PRIMARY KEY ("id_edificio")
);

-- CreateTable
CREATE TABLE "salones" (
    "id_salon" SERIAL NOT NULL,
    "id_edificio" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "tipo" "TipoSalon" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salones_pkey" PRIMARY KEY ("id_salon")
);

-- CreateTable
CREATE TABLE "profesores" (
    "id_profesor" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profesores_pkey" PRIMARY KEY ("id_profesor")
);

-- CreateTable
CREATE TABLE "cubiculos" (
    "id_cubiculo" SERIAL NOT NULL,
    "id_profesor" INTEGER NOT NULL,
    "id_edificio" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "referencia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cubiculos_pkey" PRIMARY KEY ("id_cubiculo")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id_evento" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "id_edificio" INTEGER NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id_ruta" SERIAL NOT NULL,
    "tipo" "TipoRuta" NOT NULL,
    "origen_tipo" "TipoOrigen" NOT NULL,
    "origen_id" INTEGER NOT NULL,
    "destino_tipo" "TipoDestino" NOT NULL,
    "destino_id" INTEGER NOT NULL,
    "tiempo_estimado" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id_ruta")
);

-- CreateTable
CREATE TABLE "ruta_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "instruccion" TEXT NOT NULL,
    "latitud" DECIMAL(10,8) NOT NULL,
    "longitud" DECIMAL(11,8) NOT NULL,

    CONSTRAINT "ruta_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "logs_acceso" (
    "id_log" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "dispositivo" TEXT,

    CONSTRAINT "logs_acceso_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "salones_id_edificio_idx" ON "salones"("id_edificio");

-- CreateIndex
CREATE UNIQUE INDEX "profesores_correo_key" ON "profesores"("correo");

-- CreateIndex
CREATE INDEX "cubiculos_id_profesor_idx" ON "cubiculos"("id_profesor");

-- CreateIndex
CREATE INDEX "cubiculos_id_edificio_idx" ON "cubiculos"("id_edificio");

-- CreateIndex
CREATE INDEX "eventos_id_edificio_idx" ON "eventos"("id_edificio");

-- CreateIndex
CREATE INDEX "eventos_fecha_inicio_idx" ON "eventos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "rutas_origen_tipo_origen_id_idx" ON "rutas"("origen_tipo", "origen_id");

-- CreateIndex
CREATE INDEX "rutas_destino_tipo_destino_id_idx" ON "rutas"("destino_tipo", "destino_id");

-- CreateIndex
CREATE INDEX "ruta_detalle_id_ruta_orden_idx" ON "ruta_detalle"("id_ruta", "orden");

-- CreateIndex
CREATE INDEX "logs_acceso_id_usuario_idx" ON "logs_acceso"("id_usuario");

-- CreateIndex
CREATE INDEX "logs_acceso_fecha_idx" ON "logs_acceso"("fecha");

-- AddForeignKey
ALTER TABLE "salones" ADD CONSTRAINT "salones_id_edificio_fkey" FOREIGN KEY ("id_edificio") REFERENCES "edificios"("id_edificio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubiculos" ADD CONSTRAINT "cubiculos_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "profesores"("id_profesor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubiculos" ADD CONSTRAINT "cubiculos_id_edificio_fkey" FOREIGN KEY ("id_edificio") REFERENCES "edificios"("id_edificio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_edificio_fkey" FOREIGN KEY ("id_edificio") REFERENCES "edificios"("id_edificio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_detalle" ADD CONSTRAINT "ruta_detalle_id_ruta_fkey" FOREIGN KEY ("id_ruta") REFERENCES "rutas"("id_ruta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_acceso" ADD CONSTRAINT "logs_acceso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
