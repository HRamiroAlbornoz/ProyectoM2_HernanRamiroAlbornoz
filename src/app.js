import express from 'express';
import authorsRouter from '../routes/authors.routes.js';
import postsRouter from '../routes/posts.routes.js';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/authors', authorsRouter);
app.use('/api/posts', postsRouter);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'MiniBlog API',
        endpoints: {
            authors: '/api/authors',
            posts: '/api/posts'
        }
    });
});

// Middleware: rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware: manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);

    if (err.code === '23505') {
        return res.status(409).json({ error: 'Registro duplicado' });
    }
    if (err.code === '23503') {
        return res.status(409).json({ error: 'Violación de relación entre tablas' });
    }
    if (err.code === '23502') {
        return res.status(400).json({ error: 'Campo requerido faltante' });
    }
    if (err.code === '22001') {
        return res.status(400).json({ error: 'El valor ingresado es demasiado largo' });
    }
    if (err.code === '22P02') {
        return res.status(400).json({ error: 'Tipo de dato inválido' });
    }
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: 'No se puede conectar a la base de datos' });
    }

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(status).json({ error: message });
});

export default app;