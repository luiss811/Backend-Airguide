const fs = require('fs');

// eventoNeurona.ts
let ev = fs.readFileSync('src/lib/eventoNeurona.ts', 'utf8');
ev = ev.replace('return await void inicializarNeurona();', 'return inicializarNeurona();');
ev = ev.replace('if (!modelo) await void inicializarNeurona();', 'if (!modelo) await inicializarNeurona();');
ev = ev.replace('void inicializarNeurona();', 'inicializarNeurona().catch(console.error);');
ev = ev.replace('let idSugerido = Math.round(prediccion.dataSync()[0]);', '// let idSugerido = Math.round(prediccion.dataSync()[0]);');
ev = ev.replace('idSugerido = Math.max(1, Math.min(idSugerido, maxEdificioId));', '// idSugerido = Math.max(1, Math.min(idSugerido, maxEdificioId));');
fs.writeFileSync('src/lib/eventoNeurona.ts', ev);

// congestionNeurona.ts
let cg = fs.readFileSync('src/lib/congestionNeurona.ts', 'utf8');
cg = cg.replace(/return info\.history\.loss\[info\.history\.loss\.length - 1\];/g, 'return info.history.loss.at(-1);');
cg = cg.replace('const picosHorarios = [7, 8, 13, 14, 18, 19];', 'const picosHorarios = new Set([7, 8, 13, 14, 18, 19]);');
cg = cg.replace(/picosHorarios\.includes/g, 'picosHorarios.has');
cg = cg.replace(/1\.0/g, '1');
cg = cg.replace(/0\.0/g, '0');
cg = cg.replace(`export function getModelo() {
  if (!modelo) {
    modelo = crearModelo();
  }
  return modelo;
}`, `export function getModelo() {
  modelo ??= crearModelo();
  return modelo;
}`);
fs.writeFileSync('src/lib/congestionNeurona.ts', cg);

// events-service/index.ts
let es = fs.readFileSync('src/services/events-service/index.ts', 'utf8');
// Fix catch blocks
es = es.replace(/catch\s*\((error(?:\:\s*any)?)\)\s*\{(?!\s*console\.error)/g, (match, errName) => {
    return `${match}\n    console.error(${errName.replace(': any', '')});`;
});
// parseInt
es = es.replace(/\bparseInt\(/g, 'Number.parseInt(');
// RegExp String.raw
es = es.replace(/'\/:id\(\\\\d\+\)\/invitados'/g, 'String.raw`/:id(\\d+)/invitados`');
es = es.replace(/'\/:id\(\\\\d\+\)\/registrar-invitado'/g, 'String.raw`/:id(\\d+)/registrar-invitado`');
es = es.replace(/'\/confirmar-ticket\/:id_invitado\(\\\\d\+\)'/g, 'String.raw`/confirmar-ticket/:id_invitado(\\d+)`');
es = es.replace(/'\/:id\(\\\\d\+\)\/confirmar-asistencia'/g, 'String.raw`/:id(\\d+)/confirmar-asistencia`');
es = es.replace(/'\/:id\(\\\\d\+\)'/g, 'String.raw`/:id(\\d+)`');
// prioridadVal nullish
es = es.replace(`    let prioridadVal = data.prioridad_evento;
    if (prioridadVal === undefined) {
      prioridadVal = usuarioCreador?.prioridad || 3;
      if (usuarioCreador?.rol === 'rector') prioridadVal = 4;
      else if (usuarioCreador?.rol === 'profesor') prioridadVal = 3;
    }`, `    let prioridadVal = data.prioridad_evento;
    prioridadVal ??= usuarioCreador?.prioridad || 3;
    if (prioridadVal === (usuarioCreador?.prioridad || 3)) {
      if (usuarioCreador?.rol === 'rector') prioridadVal = 4;
      else if (usuarioCreador?.rol === 'profesor') prioridadVal = 3;
    }`);

es = es.replace(`    let prioridadVal = data.prioridad_evento;
    if (prioridadVal === undefined) {
      prioridadVal = usuarioCreador?.prioridad || 3;
    }`, `    let prioridadVal = data.prioridad_evento;
    prioridadVal ??= usuarioCreador?.prioridad || 3;`);
// x-powered-by
es = es.replace('const app = express();\n', 'const app = express();\napp.disable("x-powered-by");\n');

fs.writeFileSync('src/services/events-service/index.ts', es);
console.log('Fixed final 3 files!');
