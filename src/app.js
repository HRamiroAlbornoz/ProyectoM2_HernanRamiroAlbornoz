import express from 'express';
import authorsRouter from '../routes/authors.routes.js';
import postsRouter from '../routes/posts.routes.js';
import { errorHandler } from './errorHandler.js';
import { notFound } from './errors.js';
import { swaggerUi, swaggerDocument } from './swagger.js';

const app = express();

// ================================
// Middleware
// ================================
app.use(express.json());

// ================================
// Swagger UI
// Solo disponible fuera de producción
// Accesible en http://localhost:{PORT}/api/docs
// ================================
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'MiniBlog API — Docs',
        swaggerOptions: {
            docExpansion: 'list',       // muestra los grupos colapsados por defecto
            filter: true,               // habilita el buscador de endpoints
            showRequestDuration: true,  // muestra el tiempo de respuesta al probar
        },
    }));
}

// ================================
// Rutas
// ================================
app.use('/api/authors', authorsRouter);
app.use('/api/posts', postsRouter);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'MiniBlog API',
        endpoints: {
            authors: '/api/authors',
            posts: '/api/posts',
        },
        docs: process.env.NODE_ENV !== 'production'
            ? '/api/docs'
            : null,
    });
});

// ================================
// Ruta no encontrada (404)
// Debe ir después de todas las rutas
// ================================
app.use((req, res, next) => {
    next(notFound(`No se encontró la ruta ${req.originalUrl}`));
});

// ================================
// Middleware central de errores
// SIEMPRE AL FINAL
// ================================
app.use(errorHandler);

export default app;