-- CreateTable
CREATE TABLE "codigos_otp" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codigos_otp_id_usuario_idx" ON "codigos_otp"("id_usuario");

-- CreateIndex
CREATE INDEX "codigos_otp_codigo_idx" ON "codigos_otp"("codigo");

-- AddForeignKey
ALTER TABLE "codigos_otp" ADD CONSTRAINT "codigos_otp_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
