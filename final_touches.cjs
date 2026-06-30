const fs = require('fs');

// 1. eventoNeurona.ts
let ev = fs.readFileSync('src/lib/eventoNeurona.ts', 'utf8');
// S1854, S125
ev = ev.replace(/\s*\/\/ let idSugerido = Math\.round\(prediccion\.dataSync\(\)\[0\]\);\s*\/\/\s*Limitar al rango de IDs\s*\/\/\s*\/\/ idSugerido = Math\.max\(1, Math\.min\(idSugerido, maxEdificioId\)\);/g, '');
// S7785
ev = ev.replace(/inicializarNeurona\(\)\.catch\(console\.error\);/g, 'await inicializarNeurona();');
fs.writeFileSync('src/lib/eventoNeurona.ts', ev);

// 2. events-service/index.ts
let es = fs.readFileSync('src/services/events-service/index.ts', 'utf8');
// S5689
if (!es.includes('app.disable(\'x-powered-by\');')) {
    es = es.replace('const app = express();', "const app = express();\napp.disable('x-powered-by');");
}
// S6606
es = es.replace(`    let prioridadVal = data.prioridad_evento;
    if (prioridadVal === undefined) {
      prioridadVal = usuarioCreador?.prioridad || 3;
    }`, `    let prioridadVal = data.prioridad_evento;
    prioridadVal ??= usuarioCreador?.prioridad || 3;`);
fs.writeFileSync('src/services/events-service/index.ts', es);

// 3. congestionNeurona.ts
let cg = fs.readFileSync('src/lib/congestionNeurona.ts', 'utf8');
cg = cg.replace(`  if (!modelo) {
    modelo = crearModelo();
  }`, `  modelo ??= crearModelo();`);
fs.writeFileSync('src/lib/congestionNeurona.ts', cg);

// 4. profesores-service/index.ts
let ps = fs.readFileSync('src/services/profesores-service/index.ts', 'utf8');
const cubicleCode = `    // 5. Update or Create Cubicle
    if (cubiculo) {
      const edificioId = Number.parseInt(cubiculo.id_edificio);
      const piso = Number.parseInt(cubiculo.piso);
      const numero = cubiculo.numero;
      const referencia = cubiculo.referencia || null;

      if (!Number.isNaN(edificioId) && numero) {
        const existingCubiculo = await prisma.cubiculo.findFirst({
          where: { id_profesor: profesor.id_profesor },
        });

        if (existingCubiculo) {
          await prisma.cubiculo.update({
            where: { id_cubiculo: existingCubiculo.id_cubiculo },
            data: {
              id_edificio: edificioId,
              piso: Number.isNaN(piso) ? 1 : piso,
              numero,
              referencia,
            },
          });
        } else {
          await prisma.cubiculo.create({
            data: {
              id_profesor: profesor.id_profesor,
              id_edificio: edificioId,
              piso: Number.isNaN(piso) ? 1 : piso,
              numero,
              referencia,
              activo: true,
            },
          });
        }
      }
    }`;

const newCubicleCall = `    // 5. Update or Create Cubicle
    if (cubiculo) {
      await updateOrCreateCubicle(cubiculo, profesor.id_profesor);
    }`;

const newFunction = `
async function updateOrCreateCubicle(cubiculo: any, id_profesor: number) {
  const edificioId = Number.parseInt(cubiculo.id_edificio);
  const piso = Number.parseInt(cubiculo.piso);
  const numero = cubiculo.numero;
  const referencia = cubiculo.referencia || null;

  if (Number.isNaN(edificioId) || !numero) return;

  const existingCubiculo = await prisma.cubiculo.findFirst({
    where: { id_profesor },
  });

  if (existingCubiculo) {
    await prisma.cubiculo.update({
      where: { id_cubiculo: existingCubiculo.id_cubiculo },
      data: {
        id_edificio: edificioId,
        piso: Number.isNaN(piso) ? 1 : piso,
        numero,
        referencia,
      },
    });
  } else {
    await prisma.cubiculo.create({
      data: {
        id_profesor,
        id_edificio: edificioId,
        piso: Number.isNaN(piso) ? 1 : piso,
        numero,
        referencia,
        activo: true,
      },
    });
  }
}
`;

ps = ps.replace(cubicleCode, newCubicleCall);
if (!ps.includes('async function updateOrCreateCubicle')) {
    ps += newFunction;
}
fs.writeFileSync('src/services/profesores-service/index.ts', ps);

console.log('Final 7 fixes applied!');
