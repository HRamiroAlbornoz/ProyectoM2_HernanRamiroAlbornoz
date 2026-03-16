const { loadEnvFile } = require('node:process');
loadEnvFile('.env');
const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// ================================
// GET /api/posts - Listar todos los posts
// ================================
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
});

// ================================
// GET /api/posts/author/:authorId - Posts con detalle de su autor
// IMPORTANTE: esta ruta debe ir ANTES de GET /api/posts/:id
// ================================
router.get('/author/:authorId', async (req, res, next) => {
    try {
        const { authorId } = req.params;

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

        // Si el autor no tiene posts o no existe
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron posts para este autor' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
});

// ================================
// GET /api/posts/:id - Detalle de un post
// ================================
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );

        // Si no se encontró ningún post con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// POST /api/posts - Crear un post
// ================================
router.post('/', async (req, res, next) => {
    try {
        const { title, content, author_id, published } = req.body;

        // Validación: title, content y author_id son obligatorios
        if (!title || !content || !author_id) {
            return res.status(400).json({ error: 'Los campos title, content y author_id son obligatorios' });
        }

        const result = await pool.query(
            `INSERT INTO posts (title, content, author_id, published) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [title, content, author_id, published ?? false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// PUT /api/posts/:id - Actualizar un post
// ================================
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, author_id, published } = req.body;

        // Validación: title, content y author_id son obligatorios
        if (!title || !content || !author_id) {
            return res.status(400).json({ error: 'Los campos title, content y author_id son obligatorios' });
        }

        const result = await pool.query(
            `UPDATE posts 
       SET title = $1, content = $2, author_id = $3, published = $4
       WHERE id = $5
       RETURNING *`,
            [title, content, author_id, published ?? false, id]
        );

        // Si no se encontró ningún post con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// DELETE /api/posts/:id - Eliminar un post
// ================================
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 RETURNING *',
            [id]
        );

        // Si no se encontró ningún post con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;