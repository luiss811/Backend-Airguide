import { PrismaClient } from '@prisma/client';
import * as tf from '@tensorflow/tfjs';
import { enviarNotificacionDesplazamiento } from './mailer.js';
const prisma = new PrismaClient();
// Modelo global de TensorFlow
let modelo = null;
let maxEdificioId = 10; // Valor por defecto
/**
 * Inicializa y entrena la red neuronal predictiva de recintos.
 * Simula el aprendizaje basado en hora -> edificio ideal.
 */
async function inicializarNeurona() {
    if (modelo)
        return;
    console.log("Inicializando y entrenando red neuronal de eventos...");
    // Rango de edificios basado en la DB
    const edificios = await prisma.edificio.findMany({ select: { id_edificio: true } });
    if (edificios.length > 0) {
        maxEdificioId = Math.max(...edificios.map(e => e.id_edificio));
    }
    let inputData = [];
    let outputData = [];
    const eventos = await prisma.evento.findMany({
        where: { activo: true },
        select: { fecha_inicio: true, id_edificio: true }
    });
    if (eventos.length > 0) {
        // Entrenar con datos reales
        for (const e of eventos) {
            inputData.push([e.fecha_inicio.getHours()]);
            outputData.push([Math.min(e.id_edificio, maxEdificioId)]);
        }
    }
    else {
        // Fallback o mock si no hay eventos
        inputData = [[8], [10], [12], [14], [16], [18], [20]];
        outputData = [[1], [2], [Math.min(3, maxEdificioId)], [1], [2], [1], [Math.min(3, maxEdificioId)]];
    }
    const horas = tf.tensor2d(inputData, [inputData.length, 1]);
    const preferidos = tf.tensor2d(outputData, [outputData.length, 1]);
    modelo = tf.sequential();
    modelo.add(tf.layers.dense({ units: 8, inputShape: [1], activation: 'relu' }));
    modelo.add(tf.layers.dense({ units: 1 }));
    modelo.compile({
        optimizer: tf.train.adam(0.1),
        loss: 'meanSquaredError'
    });
    const history = await modelo.fit(horas, preferidos, { epochs: 200, verbose: 0 });
    console.log("¡Entrenamiento de neurona terminado!");
    return {
        loss: history.history.loss,
        epochs: Array.from({ length: 200 }, (_, i) => i + 1)
    };
}
/**
 * Entrena manual y forzosamente la red y devuelve su historial.
 */
export async function entrenarNeurona() {
    console.log("Reiniciando y reentrenando red neuronal a petición...");
    modelo = null;
    return await inicializarNeurona();
}
/**
 * Usa la neurona para predecir el mejor edificio disponible en el horario dado
 */
async function predecirMejorEdificio(fechaInicio, fechaFin, edificioEvitadoId) {
    if (!modelo)
        await inicializarNeurona();
    const hora = fechaInicio.getHours();
    const input = tf.tensor2d([hora], [1, 1]);
    const prediccion = modelo.predict(input);
    let idSugerido = Math.round(prediccion.dataSync()[0]);
    // Limitar al rango de IDs
    idSugerido = Math.max(1, Math.min(idSugerido, maxEdificioId));
    // Buscar todos los edificios disponibles en ese horario
    const edificios = await prisma.edificio.findMany({
        where: { activo: true, id_edificio: { not: edificioEvitadoId } }
    });
    for (const edificio of edificios) {
        // Si la predicción se acerca, o tomamos el primero libre si la predicción está ocupada
        const eventosConflictivos = await prisma.evento.findFirst({
            where: {
                id_edificio: edificio.id_edificio,
                AND: [
                    { fecha_inicio: { lt: fechaFin } },
                    { fecha_fin: { gt: fechaInicio } }
                ]
            }
        });
        if (!eventosConflictivos) {
            // Retorna el primer edificio sin conflictos (en un caso real, ordenado por similitud a `idSugerido`)
            return edificio.id_edificio;
        }
    }
    return null;
}
/**
 * Función principal para evaluar y desplazar eventos
 */
export async function evaluarEvento(nuevoEvento) {
    const eventosConflicto = await prisma.evento.findMany({
        where: {
            id_edificio: nuevoEvento.id_edificio,
            AND: [
                { fecha_inicio: { lt: new Date(nuevoEvento.fecha_fin) } },
                { fecha_fin: { gt: new Date(nuevoEvento.fecha_inicio) } }
            ]
        },
        include: {
            creador: true,
            edificio: true
        }
    });
    // Si no es un bloque masivo, iteramos. (nuevoEvento.prioridad será definida como req.user default 4 para admin/rector)
    const prioridadNuevo = nuevoEvento.prioridad || 4;
    for (const eventoAfectado of eventosConflicto) {
        const prioridadAfectado = eventoAfectado.prioridad_evento;
        if (prioridadNuevo > prioridadAfectado) {
            // Ejecutar desplazamiento con AI
            const nuevoIdEdificio = await predecirMejorEdificio(eventoAfectado.fecha_inicio, eventoAfectado.fecha_fin, eventoAfectado.id_edificio);
            if (!nuevoIdEdificio) {
                return {
                    permitir: false,
                    mensaje: `No hay edificios alternativos disponibles para desplazar el evento "${eventoAfectado.nombre}".`
                };
            }
            const edificioNuevo = await prisma.edificio.findUnique({ where: { id_edificio: nuevoIdEdificio } });
            // Actualizar el evento desplazado
            await prisma.evento.update({
                where: { id_evento: eventoAfectado.id_evento },
                data: { id_edificio: nuevoIdEdificio }
            });
            // Enviar notificación al profesor
            if (eventoAfectado.creador?.correo) {
                await enviarNotificacionDesplazamiento(eventoAfectado.creador.correo, eventoAfectado.creador.nombre, eventoAfectado.nombre, eventoAfectado.edificio.nombre, edificioNuevo?.nombre || 'Nuevo Edificio', eventoAfectado.fecha_inicio);
            }
            // NOTA: La recursividad en cascada se manejaría aquí buscar otros eventos afectados 
            // en el nuevoIdEdificio, pero predecirMejorEdificio ya retorna un edificio vacío,
            // por lo que evitamos colisiones secundarias.
        }
        else {
            return {
                permitir: false,
                mensaje: "Hay un evento con mayor o igual prioridad en ese horario y lugar."
            };
        }
    }
    return {
        permitir: true,
        tipo: eventosConflicto.length > 0 ? "DESPLAZAMIENTO_REALIZADO" : "SIN_CONFLICTO"
    };
}
// Inicializar de fondo al cargar el módulo
inicializarNeurona().catch(console.error);
//# sourceMappingURL=eventoNeurona.js.map