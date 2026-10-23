import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { createEdificioSchema, updateEdificioSchema } from '../../validators/edificio.validator.js';
const app = express();
app.use(express.json());
// Get edificios
app.get('/', async (req, res) => {
    try {
        const { tipo, activo } = req.query;
        const where = {};
        if (tipo)
            where.tipo = tipo;
        if (activo !== undefined)
            where.activo = activo === 'true';
        const edificios = await prisma.edificio.findMany({
            where,
            include: {
                _count: {
                    select: { salones: true, cubiculos: true, eventos: true },
                },
            },
            orderBy: { nombre: 'asc' },
        });
        return res.json(edificios);
    }
    catch (error) {
        console.error('Get edificios error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get all salones
app.get('/salones', async (req, res) => {
    try {
        const salones = await prisma.salon.findMany({
            include: {
                edificio: {
                    select: { id_edificio: true, nombre: true, tipo: true },
                },
            },
            orderBy: [{ id_edificio: 'asc' }, { piso: 'asc' }],
        });
        return res.json(salones);
    }
    catch (error) {
        console.error('Get salones error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get edificio id
app.get('/:id(\\d+)', async (req, res) => {
    try {
        const { id } = req.params;
        const edificio = await prisma.edificio.findUnique({
            where: { id_edificio: Number(id) },
            include: {
                salones: { where: { activo: true }, orderBy: { piso: 'asc' } },
                cubiculos: {
                    where: { activo: true },
                    include: { profesor: true },
                    orderBy: { piso: 'asc' },
                },
                eventos: {
                    where: { activo: true, fecha_inicio: { gte: new Date() } },
                    orderBy: { fecha_inicio: 'asc' },
                },
            },
        });
        if (!edificio)
            return res.status(404).json({ error: 'Edificio no encontrado' });
        return res.json(edificio);
    }
    catch (error) {
        console.error('Get edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create edificio
app.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createEdificioSchema.parse(req.body);
        const edificio = await prisma.edificio.create({
            data: {
                nombre: data.nombre, descripcion: data.descripcion,
                latitud: data.latitud, longitud: data.longitud,
                tipo: data.tipo, activo: data.activo ?? true,
            },
        });
        return res.status(201).json(edificio);
    }
    catch (error) {
        if (error.name === 'ZodError')
            return res.status(400).json({ error: error.errors[0].message });
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Update edificio
app.put('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateEdificioSchema.parse(req.body);
        const existingEdificio = await prisma.edificio.findUnique({ where: { id_edificio: Number(id) } });
        if (!existingEdificio)
            return res.status(404).json({ error: 'Edificio no encontrado' });
        const edificio = await prisma.edificio.update({ where: { id_edificio: Number(id) }, data });
        return res.json(edificio);
    }
    catch (error) {
        if (error.name === 'ZodError')
            return res.status(400).json({ error: error.errors[0].message });
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Delete edificio
app.delete('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.edificio.delete({ where: { id_edificio: Number(id) } });
        return res.json({ message: 'Edificio eliminado' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Get salones by edificio
app.get('/:id(\\d+)/salones', async (req, res) => {
    try {
        const { id } = req.params;
        const salones = await prisma.salon.findMany({
            where: { id_edificio: Number(id) },
            orderBy: { piso: 'asc' },
        });
        return res.json(salones);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Create salon
app.post('/:id(\\d+)/salones', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, piso, tipo, activo } = req.body;
        const edificio = await prisma.edificio.findUnique({ where: { id_edificio: Number(id) } });
        if (!edificio)
            return res.status(404).json({ error: 'Edificio no encontrado' });
        const salon = await prisma.salon.create({
            data: { id_edificio: Number(id), nombre, piso, tipo, activo: activo !== undefined ? activo : true },
            include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true } } },
        });
        return res.status(201).json(salon);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Update salon
app.put('/salones/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const salon = await prisma.salon.update({
            where: { id_salon: Number(id) }, data: updateData,
            include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true } } }
        });
        return res.json(salon);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Delete salon
app.delete('/salones/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.salon.delete({ where: { id_salon: Number(id) } });
        return res.json({ message: 'Salón eliminado' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Get all profesores
app.get('/profesores', async (req, res) => {
    try {
        const profesor = await prisma.profesor.findMany({
            include: {
                usuario: { select: { nombre: true, correo: true } },
                cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true, latitud: true, longitud: true, tipo: true } } } },
            },
        });
        return res.json(profesor);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get single profesor
app.get('/profesores/:id(\\d+)', async (req, res) => {
    try {
        const { id } = req.params;
        const profesor = await prisma.profesor.findUnique({
            where: { id_profesor: Number(id) },
            include: {
                usuario: { select: { nombre: true, correo: true } },
                cubiculos: { include: { edificio: true } },
            },
        });
        if (!profesor)
            return res.status(404).json({ error: 'Profesor no encontrado' });
        return res.json(profesor);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Create profesor
app.post('/profesores', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id_usuario, departamento, id_cubiculo, activo } = req.body;
        await prisma.usuario.update({ where: { id_usuario: parseInt(id_usuario) }, data: { rol: 'profesor' } });
        const profesor = await prisma.profesor.create({
            data: { id_usuario: parseInt(id_usuario), departamento, activo: activo !== undefined ? activo : true },
            include: { usuario: { select: { nombre: true, correo: true } }, cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true } } } } }
        });
        if (id_cubiculo) {
            await prisma.cubiculo.update({ where: { id_cubiculo: parseInt(id_cubiculo) }, data: { id_profesor: profesor.id_profesor } });
        }
        return res.status(201).json(profesor);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Update profesor
app.put('/profesores/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const profesor = await prisma.profesor.update({
            where: { id_profesor: Number(id) }, data: { departamento: updateData.departamento, activo: updateData.activo },
            include: { usuario: { select: { nombre: true, correo: true } }, cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true } } } } }
        });
        if (updateData.id_cubiculo) {
            await prisma.cubiculo.update({ where: { id_cubiculo: parseInt(updateData.id_cubiculo) }, data: { id_profesor: profesor.id_profesor } });
        }
        return res.json(profesor);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// Delete profesor
app.delete('/profesores/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.profesor.delete({ where: { id_profesor: Number(id) } });
        return res.json({ message: 'Profesor eliminado' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
// --- CUBICULOS --- //
// Get all cubiculos
app.get('/cubiculos', async (req, res) => {
    try {
        const cubiculos = await prisma.cubiculo.findMany({
            include: {
                edificio: { select: { id_edificio: true, nombre: true } },
                profesor: {
                    include: { usuario: { select: { nombre: true, correo: true } } }
                }
            },
            orderBy: { id_edificio: 'asc' }
        });
        return res.json(cubiculos);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create cubiculo
app.post('/cubiculos', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id_profesor, id_edificio, numero, piso, referencia, activo } = req.body;
        const cubiculo = await prisma.cubiculo.create({
            data: {
                id_profesor: parseInt(id_profesor),
                id_edificio: parseInt(id_edificio),
                numero,
                piso: parseInt(piso),
                referencia,
                activo: activo ?? true
            },
            include: {
                edificio: { select: { id_edificio: true, nombre: true } },
                profesor: { include: { usuario: { select: { nombre: true, correo: true } } } }
            }
        });
        return res.status(201).json(cubiculo);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al crear cubículo' });
    }
});
// Update cubiculo
app.put('/cubiculos/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_profesor, id_edificio, numero, piso, referencia, activo } = req.body;
        const cubiculo = await prisma.cubiculo.update({
            where: { id_cubiculo: parseInt(id) },
            data: {
                id_profesor: parseInt(id_profesor),
                id_edificio: parseInt(id_edificio),
                numero,
                piso: parseInt(piso),
                referencia,
                activo
            },
            include: {
                edificio: { select: { id_edificio: true, nombre: true } },
                profesor: { include: { usuario: { select: { nombre: true, correo: true } } } }
            }
        });
        return res.json(cubiculo);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al actualizar cubículo' });
    }
});
// Delete cubiculo
app.delete('/cubiculos/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cubiculo.delete({ where: { id_cubiculo: parseInt(id) } });
        return res.json({ message: 'Cubículo eliminado exitosamente' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al eliminar cubículo' });
    }
});
<<<<<<< HEAD
// ==========================================
// E-COMMERCE: PRODUCTOS & VENTAS ENDPOINTS
// ==========================================
// GET /productos
app.get('/productos', async (req, res) => {
    try {
        const { categoria, activo, search } = req.query;
        const where = {};
        if (categoria && categoria !== 'todos')
            where.categoria = String(categoria);
        if (activo !== undefined)
            where.activo = activo === 'true';
        if (search) {
            where.OR = [
                { nombre: { contains: String(search), mode: 'insensitive' } },
                { descripcion: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const productos = await prisma.producto.findMany({
            where,
            orderBy: { id_producto: 'desc' },
        });
        return res.json(productos);
    }
    catch (error) {
        console.error('Get productos error:', error);
        return res.status(500).json({ error: 'Error al obtener productos' });
    }
});
// GET /productos/:id
app.get('/productos/:id(\\d+)', async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await prisma.producto.findUnique({
            where: { id_producto: Number(id) },
        });
        if (!producto)
            return res.status(404).json({ error: 'Producto no encontrado' });
        return res.json(producto);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener producto' });
    }
});
// POST /productos (Admin)
app.post('/productos', authenticate, requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, stock, imagen_url, activo } = req.body;
        if (!nombre || precio === undefined || !categoria) {
            return res.status(400).json({ error: 'Nombre, precio y categoría son requeridos' });
        }
        const producto = await prisma.producto.create({
            data: {
                nombre,
                descripcion,
                precio: Number(precio),
                categoria,
                stock: Number(stock || 0),
                imagen_url,
                activo: activo !== undefined ? Boolean(activo) : true,
            },
        });
        return res.status(201).json(producto);
    }
    catch (error) {
        console.error('Create producto error:', error);
        return res.status(500).json({ error: 'Error al crear producto' });
    }
});
// PUT /productos/:id (Admin)
app.put('/productos/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria, stock, imagen_url, activo } = req.body;
        const dataToUpdate = {};
        if (nombre !== undefined)
            dataToUpdate.nombre = nombre;
        if (descripcion !== undefined)
            dataToUpdate.descripcion = descripcion;
        if (precio !== undefined)
            dataToUpdate.precio = Number(precio);
        if (categoria !== undefined)
            dataToUpdate.categoria = categoria;
        if (stock !== undefined)
            dataToUpdate.stock = Number(stock);
        if (imagen_url !== undefined)
            dataToUpdate.imagen_url = imagen_url;
        if (activo !== undefined)
            dataToUpdate.activo = Boolean(activo);
        const producto = await prisma.producto.update({
            where: { id_producto: Number(id) },
            data: dataToUpdate,
        });
        return res.json(producto);
    }
    catch (error) {
        console.error('Update producto error:', error);
        return res.status(500).json({ error: 'Error al actualizar producto' });
    }
});
// DELETE /productos/:id (Admin)
app.delete('/productos/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.producto.delete({ where: { id_producto: Number(id) } });
        return res.json({ message: 'Producto eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete producto error:', error);
        return res.status(500).json({ error: 'Error al eliminar producto' });
    }
});
// POST /ventas (Crear venta / checkout)
app.post('/ventas', async (req, res) => {
    try {
        const { id_usuario, cliente_nombre, cliente_correo, metodo_pago, items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito no contiene productos' });
        }
        // Verificar existencias y calcular total
        let totalCalculado = 0;
        const detallesData = [];
        for (const item of items) {
            const prod = await prisma.producto.findUnique({ where: { id_producto: item.id_producto } });
            if (!prod) {
                return res.status(404).json({ error: `Producto ID ${item.id_producto} no encontrado` });
            }
            if (prod.stock < item.cantidad) {
                return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre}` });
            }
            const subtotal = Number(prod.precio) * Number(item.cantidad);
            totalCalculado += subtotal;
            detallesData.push({
                id_producto: prod.id_producto,
                cantidad: Number(item.cantidad),
                precio_unitario: Number(prod.precio),
                subtotal,
            });
            // Descontar stock
            await prisma.producto.update({
                where: { id_producto: prod.id_producto },
                data: { stock: prod.stock - Number(item.cantidad) },
            });
        }
        const venta = await prisma.venta.create({
            data: {
                id_usuario: id_usuario ? Number(id_usuario) : null,
                cliente_nombre,
                cliente_correo,
                total: totalCalculado,
                metodo_pago: metodo_pago || 'tarjeta',
                estado: 'completado',
                detalles: {
                    create: detallesData,
                },
            },
            include: {
                detalles: {
                    include: { producto: true },
                },
            },
        });
        return res.status(201).json(venta);
    }
    catch (error) {
        console.error('Create venta error:', error);
        return res.status(500).json({ error: 'Error al procesar la venta' });
    }
});
// GET /ventas (Admin listing)
app.get('/ventas', authenticate, requireAdmin, async (req, res) => {
    try {
        const ventas = await prisma.venta.findMany({
            include: {
                usuario: { select: { nombre: true, correo: true } },
                detalles: { include: { producto: { select: { nombre: true, categoria: true } } } },
            },
            orderBy: { fecha_venta: 'desc' },
        });
        return res.json(ventas);
    }
    catch (error) {
        console.error('Get ventas error:', error);
        return res.status(500).json({ error: 'Error al consultar ventas' });
    }
});
const PORT = process.env.PORT_BUILDINGS || 3012;
/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log('Servicio de Edificios corriendo'));
}
/* v8 ignore stop */
export { app };
=======
const PORT = process.env.PORT_BUILDINGS || 3012;
app.listen(PORT, () => console.log('Servicio de Edificios corriendo'));
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
//# sourceMappingURL=index.js.map