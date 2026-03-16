const { loadEnvFile } = require('node:process');
const express = require('express');
const authorsRouter = require('./routes/authors.routes');
const postsRouter = require('./routes/posts.routes');

loadEnvFile('.env');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
// Permite que Express entienda el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Rutas
app.use('/api/authors', authorsRouter);
app.use('/api/posts', postsRouter);

// Ruta raíz - útil para verificar que el servidor está funcionando
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

    // ================================
    // Errores específicos de PostgreSQL
    // ================================

    // Email o campo único duplicado
    if (err.code === '23505') {
        return res.status(409).json({ error: 'Registro duplicado' });
    }

    // author_id no existe en la tabla authors
    if (err.code === '23503') {
        return res.status(409).json({ error: 'Violación de relación entre tablas' });
    }

    // Campo NOT NULL enviado vacío
    if (err.code === '23502') {
        return res.status(400).json({ error: 'Campo requerido faltante' });
    }

    // Valor demasiado largo para el campo
    if (err.code === '22001') {
        return res.status(400).json({ error: 'El valor ingresado es demasiado largo' });
    }

    // Tipo de dato incorrecto (ej: texto donde se espera un número)
    if (err.code === '22P02') {
        return res.status(400).json({ error: 'Tipo de dato inválido' });
    }

    // PostgreSQL no está corriendo o credenciales incorrectas
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: 'No se puede conectar a la base de datos' });
    }

    // ================================
    // Errores generales de la aplicación
    // ================================

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(status).json({ error: message });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;