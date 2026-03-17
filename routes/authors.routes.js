import express from 'express';
import pool from '../db/config.js';
import { isValidId, sanitizeHtml, validateAuthorFields, MESSAGES } from '../src/validator.js';

const authorsRouter = express.Router();

// ================================
// GET /api/authors
// ================================
authorsRouter.get('/', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM authors ORDER BY created_at DESC');
        console.log(`[GET /api/authors] ${result.rows.length} autores encontrados`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('[GET /api/authors] Error al listar autores:', err.message);
        next(err);
    }
});

// ================================
// GET /api/authors/:id
// ================================
authorsRouter.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[GET /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

        const result = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            console.error(`[GET /api/authors/:id] Autor no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        console.log(`[GET /api/authors/:id] Autor encontrado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`[GET /api/authors/:id] Error:`, err.message);
        next(err);
    }
});

// ================================
// POST /api/authors
// ================================
authorsRouter.post('/', async (req, res, next) => {
    try {
        const name = sanitizeHtml(req.body.name?.trim());
        const email = req.body.email?.trim().toLowerCase();         // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
        const bio = sanitizeHtml(req.body.bio?.trim()) || null;   // Si bio no se envía, lo dejamos como null

        const validationError = validateAuthorFields(name, email);
        if (validationError) {
            console.error(`[POST /api/authors] Validación fallida: ${validationError}`);
            return res.status(400).json({ error: validationError });
        }

        const result = await pool.query(
            'INSERT INTO authors (name, email, bio) VALUES ($1, $2, $3) RETURNING *',
            [name, email, bio]
        );

        console.log(`[POST /api/authors] Autor creado con id: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            console.error(`[POST /api/authors] Email duplicado: ${req.body.email}`);
            return res.status(409).json({ error: `El email ${req.body.email} ya está registrado` });
        }
        console.error('[POST /api/authors] Error al crear autor:', err.message);
        next(err);
    }
});

// ================================
// PUT /api/authors/:id
// ================================
authorsRouter.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[PUT /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

        const name = sanitizeHtml(req.body.name?.trim());
        const email = req.body.email?.trim().toLowerCase();         // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
        const bio = sanitizeHtml(req.body.bio?.trim()) || null;   // Si bio no se envía, lo dejamos como null

        const validationError = validateAuthorFields(name, email);
        if (validationError) {
            console.error(`[PUT /api/authors/:id] Validación fallida para id ${id}: ${validationError}`);
            return res.status(400).json({ error: validationError });
        }

        const result = await pool.query(
            `UPDATE authors SET name = $1, email = $2, bio = $3 WHERE id = $4 RETURNING *`,
            [name, email, bio, id]
        );

        if (result.rows.length === 0) {
            console.error(`[PUT /api/authors/:id] Autor no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        console.log(`[PUT /api/authors/:id] Autor actualizado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            console.error(`[PUT /api/authors/:id] Email duplicado: ${req.body.email}`);
            return res.status(409).json({ error: `El email ${req.body.email} ya está registrado` });
        }
        console.error(`[PUT /api/authors/:id] Error:`, err.message);
        next(err);
    }
});

// ================================
// DELETE /api/authors/:id
// ================================
authorsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[DELETE /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: MESSAGES.INVALID_ID });
        }

        const result = await pool.query('DELETE FROM authors WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            console.error(`[DELETE /api/authors/:id] Autor no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        console.log(`[DELETE /api/authors/:id] Autor eliminado con id: ${id}`);
        res.status(204).send();
    } catch (err) {
        console.error(`[DELETE /api/authors/:id] Error:`, err.message);
        next(err);
    }
});

export default authorsRouter;