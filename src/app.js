import express from 'express';
import authorsRouter from '../routes/authors.routes.js';
import postsRouter from '../routes/posts.routes.js';
import { errorHandler } from './errorHandler.js';
import { notFound } from './errors.js';

const app = express();

// ================================
// Middleware
// ================================
app.use(express.json());

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
        }
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