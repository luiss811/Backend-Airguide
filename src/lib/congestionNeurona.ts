import * as tf from '@tensorflow/tfjs';
import { prisma } from './prisma.js';

let modelo: tf.Sequential | null = null;
let isTraining = false;

// Configuración de la red
function crearModelo() {
  const model = tf.sequential();
  // Entrada: [HoraNormalizada (0-1), EsPico (0|1), UsoHistórico (0-1)]
  model.add(tf.layers.dense({ units: 16, inputShape: [3], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  // Salida: Riesgo de Congestión (0 a 1)
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mse'],
  });

  return model;
}

// Inicializar el modelo on-the-fly si no existe
export function getModelo() {
  if (!modelo) {
    modelo = crearModelo();
  }
  return modelo;
}

// Entrenar con datos dinámicos extraídos de Prisma
export async function entrenarCongestion() {
  if (isTraining) throw new Error("El modelo ya se está entrenando en este momento.");
  isTraining = true;
  
  try {
    getModelo(); // Asegurar que está creado

    // Obtener estadísticas reales
    const rutasActivas = await prisma.ruta.findMany({
      where: { activo: true },
      select: { contador_usos: true }
    });

    const inputs: number[][] = [];
    const outputs: number[][] = [];

    // Generar muestras simulando picos escolares
    // En una universidad, hay más tráfico antes y después de clases (7-8, 14-15, 18-19 hrs)
    // El contador_usos escala la congestión base de una ruta
    let iteraciones = 200; // Fake historic epoch points
    const picosHorarios = [7, 8, 13, 14, 18, 19];
    
    // Normalizador aproximado de usos para evitar explotar la sigmoide
    const maxUsos = Math.max(...rutasActivas.map(r => r.contador_usos), 10);

    for (let i = 0; i < iteraciones; i++) {
        // Tomamos una ruta al azar
        const rutaRandom = rutasActivas[Math.floor(Math.random() * rutasActivas.length)];
        const usosNormalized = (rutaRandom?.contador_usos || 0) / maxUsos;
        
        // Asignamos una hora aleatoria
        const horaHipotetica = Math.floor(Math.random() * 24);
        const esPico = picosHorarios.includes(horaHipotetica) ? 1.0 : 0.0;
        
        let congestionScore = usosNormalized * 0.3; // Base risk given by its popularity
        
        if (picosHorarios.includes(horaHipotetica)) {
            congestionScore += 0.6 + (Math.random() * 0.1); // Pico de muchedumbre
        } else if (horaHipotetica > 20 || horaHipotetica < 6) {
            congestionScore *= 0.1; // Desierta en madrugadas
        }

        // Capping a 1.0
        congestionScore = Math.min(congestionScore, 1.0);

        inputs.push([horaHipotetica / 24, esPico, usosNormalized]);
        outputs.push([congestionScore]);
    }

    const xs = tf.tensor2d(inputs, [inputs.length, 3]);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    const info = await modelo!.fit(xs, ys, {
      epochs: 80,
      batchSize: 16,
      shuffle: true
    });

    xs.dispose();
    ys.dispose();

    isTraining = false;
    return info.history.loss[info.history.loss.length - 1]; // Retornar error final
  } catch (error) {
    isTraining = false;
    throw error;
  }
}

export async function predecirCongestionRuta(idRuta: number, horaLocal: number): Promise<number> {
    const modeloRef = getModelo();
    
    // Obtener uso de la BD
    const ruta = await prisma.ruta.findUnique({
        where: { id_ruta: idRuta },
        select: { contador_usos: true }
    });
    
    if (!ruta) return 0.0;
    
    // Consultar cual es el uso máximo actual de todas las rutas (costoso individualmente pero simple aquí, realísticamente deberíamos cacharlo)
    const stats = await prisma.ruta.aggregate({ _max: { contador_usos: true }});
    const maxUsos = Math.max(stats._max.contador_usos || 10, 10);
    
    const usosNormalized = ruta.contador_usos / maxUsos;

    const picosHorarios = [7, 8, 13, 14, 18, 19];
    const esPico = picosHorarios.includes(horaLocal) ? 1.0 : 0.0;

    const inputData = tf.tensor2d([[horaLocal / 24, esPico, usosNormalized]], [1, 3]);
    const score = modeloRef.predict(inputData) as tf.Tensor;
    const arrayScore = await score.data();
    
    inputData.dispose();
    score.dispose();

    return arrayScore[0]; // Retorna entre 0 y 1
}
