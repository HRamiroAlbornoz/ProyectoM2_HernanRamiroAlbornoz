import express from 'express';
import pool from '../db/config.js';
import { isValidId, sanitizeHtml, validatePostFields, MESSAGES } from '../src/validator.js';
import { asyncHandler } from '../src/asyncHandler.js';
import { badRequest, notFound, fromPostgresError } from '../src/errors.js';

const postsRouter = express.Router();

// ================================
// GET /api/posts - Listar todos los posts
// ================================
postsRouter.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    console.log(`[GET /api/posts] ${result.rows.length} posts encontrados`);
    res.status(200).json(result.rows);
}));

// ================================
// GET /api/posts/author/:authorId - Posts con detalle de su autor
// IMPORTANTE: esta ruta debe ir ANTES de GET /api/posts/:id
// ================================
postsRouter.get('/author/:authorId', asyncHandler(async (req, res) => {
    const { authorId } = req.params;

    if (!isValidId(authorId)) throw badRequest(MESSAGES.INVALID_AUTHOR_ID);

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

    if (result.rows.length === 0) throw notFound('No se encontraron posts para este autor');

    console.log(`[GET /api/posts/author/:authorId] ${result.rows.length} posts encontrados`);
    res.status(200).json(result.rows);
}));

// ================================
// GET /api/posts/:id - Detalle de un post
// ================================
postsRouter.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rows.length === 0) throw notFound('Post no encontrado');

    console.log(`[GET /api/posts/:id] Post encontrado con id: ${id}`);
    res.status(200).json(result.rows[0]);
}));

// ================================
// POST /api/posts - Crear un post
// ================================
postsRouter.post('/', asyncHandler(async (req, res) => {
    const title = sanitizeHtml(req.body.title?.trim());
    const content = sanitizeHtml(req.body.content?.trim());
    const author_id = req.body.author_id;
    const published = req.body.published ?? false;

    const validationError = validatePostFields(title, content, author_id, published);
    if (validationError) throw badRequest(validationError);

    try {
        const result = await pool.query(
            `INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, content, author_id, published]
        );
        console.log(`[POST /api/posts] Post creado con id: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        throw fromPostgresError(err, { author_id });
    }
}));

// ================================
// PUT /api/posts/:id - Actualizar un post
// ================================
postsRouter.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const title = sanitizeHtml(req.body.title?.trim());
    const content = sanitizeHtml(req.body.content?.trim());
    const author_id = req.body.author_id;
    const published = req.body.published ?? false;

    const validationError = validatePostFields(title, content, author_id, published);
    if (validationError) throw badRequest(validationError);

    try {
        const result = await pool.query(
            `UPDATE posts SET title = $1, content = $2, author_id = $3, published = $4 WHERE id = $5 RETURNING *`,
            [title, content, author_id, published, id]
        );

        if (result.rows.length === 0) throw notFound('Post no encontrado');

        console.log(`[PUT /api/posts/:id] Post actualizado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.statusCode) throw err; // re-lanza errores ya procesados (notFound)
        throw fromPostgresError(err, { author_id });
    }
}));

// ================================
// DELETE /api/posts/:id - Eliminar un post
// ================================
postsRouter.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) throw notFound('Post no encontrado');

    console.log(`[DELETE /api/posts/:id] Post eliminado con id: ${id}`);
    res.status(204).send();
}));

export default postsRouter;