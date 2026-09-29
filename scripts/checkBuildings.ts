import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const edificios = await prisma.edificio.findMany({
    where: {
      OR: [
        { nombre: { contains: 'CIC' } },
        { nombre: { contains: 'CEPRODI' } },
        { nombre: { contains: 'Creativity' } }
      ]
    }
  });
  console.log(JSON.stringify(edificios, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
