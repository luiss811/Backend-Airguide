-- CreateTable
CREATE TABLE "caminos_geograficos" (
    "id_camino" SERIAL NOT NULL,
    "osm_id" BIGINT NOT NULL,
    "tipo" TEXT NOT NULL,
    "geometria" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "caminos_geograficos_pkey" PRIMARY KEY ("id_camino")
);

-- CreateIndex
CREATE UNIQUE INDEX "caminos_geograficos_osm_id_key" ON "caminos_geograficos"("osm_id");
