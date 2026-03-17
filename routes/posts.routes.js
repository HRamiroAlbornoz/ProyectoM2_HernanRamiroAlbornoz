const { loadEnvFile } = require('node:process');
loadEnvFile('.env');

const express = require('express');
const postsRouter = express.Router();
const pool = require('../db/config');

// ================================
// Funciones auxiliares
// ================================

// Verifica que el id sea un número entero positivo
function isValidId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Elimina etiquetas HTML para prevenir ataques XSS
// Por ejemplo: "<script>alert('hack')</script>" → "alert('hack')"
function sanitizeHtml(text) {
    if (!text) return text;
    return text.replace(/<[^>]*>/g, '');
}

// Valida los campos obligatorios de un post
// Retorna un mensaje de error o null si todo está bien
function validatePostFields(title, content, author_id, published) {
    if (!title) {
        return 'El campo title es obligatorio';
    }
    if (title.length > 200) {
        return 'El campo title no puede superar los 200 caracteres';
    }
    if (!content) {
        return 'El campo content es obligatorio';
    }
    if (content.length > 5000) {
        return 'El campo content no puede superar los 5000 caracteres';
    }
    if (!author_id) {
        return 'El campo author_id es obligatorio';
    }
    if (!isValidId(author_id)) {
        return 'El campo author_id debe ser un número entero positivo';
    }
    if (published !== undefined && typeof published !== 'boolean') {
        return 'El campo published debe ser true o false';
    }
    return null; // null significa que no hay errores
}

// ================================
// GET /api/posts - Listar todos los posts
// ================================
postsRouter.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        console.log(`[GET /api/posts] ${result.rows.length} posts encontrados`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('[GET /api/posts] Error al listar posts:', err.message);
        next(err);
    }
});

// ================================
// GET /api/posts/author/:authorId - Posts con detalle de su autor
// IMPORTANTE: esta ruta debe ir ANTES de GET /api/posts/:id
// ================================
postsRouter.get('/author/:authorId', async (req, res, next) => {
    try {
        const { authorId } = req.params;

        if (!isValidId(authorId)) {
            console.error(`[GET /api/posts/author/:authorId] authorId inválido recibido: ${authorId}`);
            return res.status(400).json({ error: 'El authorId debe ser un número entero positivo' });
        }

        const result = await pool.query(
            `SELECT 
        posts.id,
        posts.title,
        posts.content,
        posts.published,
        posts.created_at,
        authors.id         AS author_id,
        authors.name       AS author_name,
        authors.email      AS author_email,
        authors.bio        AS author_bio
       FROM posts
       JOIN authors ON posts.author_id = authors.id
       WHERE authors.id = $1
       ORDER BY posts.created_at DESC`,
            [authorId]
        );

        if (result.rows.length === 0) {
            console.error(`[GET /api/posts/author/:authorId] No se encontraron posts para el autor con id: ${authorId}`);
            return res.status(404).json({ error: 'No se encontraron posts para este autor' });
        }

        console.log(`[GET /api/posts/author/:authorId] ${result.rows.length} posts encontrados para el autor con id: ${authorId}`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`[GET /api/posts/author/:authorId] Error al obtener posts del autor con id ${req.params.authorId}:`, err.message);
        next(err);
    }
});

// ================================
// GET /api/posts/:id - Detalle de un post
// ================================
postsRouter.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[GET /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            console.error(`[GET /api/posts/:id] Post no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        console.log(`[GET /api/posts/:id] Post encontrado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`[GET /api/posts/:id] Error al obtener post con id ${req.params.id}:`, err.message);
        next(err);
    }
});

// ================================
// POST /api/posts - Crear un post
// ================================
postsRouter.post('/', async (req, res, next) => {
    try {
        // Sanitizamos title y content para prevenir XSS
        const title = sanitizeHtml(req.body.title?.trim());
        const content = sanitizeHtml(req.body.content?.trim());
        const author_id = req.body.author_id;
        const published = req.body.published ?? false;

        const validationError = validatePostFields(title, content, author_id, published);
        if (validationError) {
            console.error(`[POST /api/posts] Validación fallida: ${validationError}`);
            return res.status(400).json({ error: validationError });
        }

        const result = await pool.query(
            `INSERT INTO posts (title, content, author_id, published) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [title, content, author_id, published]
        );

        console.log(`[POST /api/posts] Post creado con id: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            console.error(`[POST /api/posts] author_id inexistente: ${req.body.author_id}`);
            return res.status(404).json({ error: `No existe un autor con id ${req.body.author_id}` });
        }
        console.error('[POST /api/posts] Error al crear post:', err.message);
        next(err);
    }
});

// ================================
// PUT /api/posts/:id - Actualizar un post
// ================================
postsRouter.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[PUT /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        // Sanitizamos title y content para prevenir XSS
        const title = sanitizeHtml(req.body.title?.trim());
        const content = sanitizeHtml(req.body.content?.trim());
        const author_id = req.body.author_id;
        const published = req.body.published ?? false;

        const validationError = validatePostFields(title, content, author_id, published);
        if (validationError) {
            console.error(`[PUT /api/posts/:id] Validación fallida para id ${id}: ${validationError}`);
            return res.status(400).json({ error: validationError });
        }

        const result = await pool.query(
            `UPDATE posts 
       SET title = $1, content = $2, author_id = $3, published = $4
       WHERE id = $5
       RETURNING *`,
            [title, content, author_id, published, id]
        );

        if (result.rows.length === 0) {
            console.error(`[PUT /api/posts/:id] Post no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        console.log(`[PUT /api/posts/:id] Post actualizado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            console.error(`[PUT /api/posts/:id] author_id inexistente: ${req.body.author_id}`);
            return res.status(404).json({ error: `No existe un autor con id ${req.body.author_id}` });
        }
        console.error(`[PUT /api/posts/:id] Error al actualizar post con id ${req.params.id}:`, err.message);
        next(err);
    }
});

// ================================
// DELETE /api/posts/:id - Eliminar un post
// ================================
postsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[DELETE /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            console.error(`[DELETE /api/posts/:id] Post no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        console.log(`[DELETE /api/posts/:id] Post eliminado con id: ${id}`);
        res.status(204).send();
    } catch (err) {
        console.error(`[DELETE /api/posts/:id] Error al eliminar post con id ${req.params.id}:`, err.message);
        next(err);
    }
});

module.exports = postsRouter;