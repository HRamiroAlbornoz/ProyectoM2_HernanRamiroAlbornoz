import express from 'express';
import pool from '../db/config.js';
import { isValidId, sanitizeHtml, validatePostFields, MESSAGES } from '../src/validator.js';

const postsRouter = express.Router();

// ================================
// GET /api/posts
// ================================
postsRouter.get('/', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
        console.log(`[GET /api/posts] ${result.rows.length} posts encontrados`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('[GET /api/posts] Error al listar posts:', err.message);
        next(err);
    }
});

// ================================
// GET /api/posts/author/:authorId
// IMPORTANTE: esta ruta debe ir ANTES de GET /api/posts/:id
// ================================
postsRouter.get('/author/:authorId', async (req, res, next) => {
    try {
        const { authorId } = req.params;

        if (!isValidId(authorId)) {
            console.error(`[GET /api/posts/author/:authorId] authorId inválido: ${authorId}`);
            return res.status(400).json({ error: MESSAGES.INVALID_AUTHOR_ID });
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
            console.error(`[GET /api/posts/author/:authorId] No hay posts para el autor con id: ${authorId}`);
            return res.status(404).json({ error: 'No se encontraron posts para este autor' });
        }

        console.log(`[GET /api/posts/author/:authorId] ${result.rows.length} posts encontrados`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`[GET /api/posts/author/:authorId] Error:`, err.message);
        next(err);
    }
});

// ================================
// GET /api/posts/:id
// ================================
postsRouter.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[GET /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

        const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            console.error(`[GET /api/posts/:id] Post no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        console.log(`[GET /api/posts/:id] Post encontrado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`[GET /api/posts/:id] Error:`, err.message);
        next(err);
    }
});

// ================================
// POST /api/posts
// ================================
postsRouter.post('/', async (req, res, next) => {
    try {
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
            `INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING *`,
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
// PUT /api/posts/:id
// ================================
postsRouter.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[PUT /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

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
            `UPDATE posts SET title = $1, content = $2, author_id = $3, published = $4 WHERE id = $5 RETURNING *`,
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
        console.error(`[PUT /api/posts/:id] Error:`, err.message);
        next(err);
    }
});

// ================================
// DELETE /api/posts/:id
// ================================
postsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[DELETE /api/posts/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

        const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            console.error(`[DELETE /api/posts/:id] Post no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        console.log(`[DELETE /api/posts/:id] Post eliminado con id: ${id}`);
        res.status(204).send();
    } catch (err) {
        console.error(`[DELETE /api/posts/:id] Error:`, err.message);
        next(err);
    }
});

export default postsRouter;