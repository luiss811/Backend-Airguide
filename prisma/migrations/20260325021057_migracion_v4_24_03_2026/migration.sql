/*
  Warnings:

  - You are about to drop the column `correo` on the `profesores` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `profesores` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_usuario]` on the table `profesores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_creador` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_usuario` to the `profesores` table without a default value. This is not possible if the table is not empty.
  - Made the column `matricula` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RolUsuario" ADD VALUE 'rector';
ALTER TYPE "RolUsuario" ADD VALUE 'profesor';

-- DropIndex
DROP INDEX "profesores_correo_key";

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "id_creador" INTEGER NOT NULL,
ADD COLUMN     "prioridad_evento" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "profesores" DROP COLUMN "correo",
DROP COLUMN "nombre",
ADD COLUMN     "id_usuario" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "prioridad" INTEGER NOT NULL DEFAULT 4,
ALTER COLUMN "matricula" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profesores_id_usuario_key" ON "profesores"("id_usuario");

-- CreateIndex
CREATE INDEX "profesores_id_usuario_idx" ON "profesores"("id_usuario");

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
