import express from 'express';
import pool from '../db/config.js';
import { isValidId, sanitizeHtml, validateAuthorFields, MESSAGES } from '../src/validator.js';
import { asyncHandler } from '../src/asyncHandler.js';
import { badRequest, notFound, fromPostgresError } from '../src/errors.js';

const authorsRouter = express.Router();

// ================================
// GET /api/authors - Listar todos los autores
// ================================
authorsRouter.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM authors ORDER BY created_at DESC');
    console.log(`[GET /api/authors] ${result.rows.length} autores encontrados`);
    res.status(200).json(result.rows);
}));

// ================================
// GET /api/authors/:id - Detalle de un autor
// ================================
authorsRouter.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const result = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);

    if (result.rows.length === 0) throw notFound('Autor no encontrado');

    console.log(`[GET /api/authors/:id] Autor encontrado con id: ${id}`);
    res.status(200).json(result.rows[0]);
}));

// ================================
// POST /api/authors - Crear un autor
// ================================
authorsRouter.post('/', asyncHandler(async (req, res) => {
    const name = sanitizeHtml(req.body.name?.trim());
    const email = req.body.email?.trim().toLowerCase();     // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
    const bio = sanitizeHtml(req.body.bio?.trim()) || null; // Si bio no se envía, lo dejamos como null

    const validationError = validateAuthorFields(name, email);
    if (validationError) throw badRequest(validationError);

    try {
        const result = await pool.query(
            'INSERT INTO authors (name, email, bio) VALUES ($1, $2, $3) RETURNING *',
            [name, email, bio]
        );
        console.log(`[POST /api/authors] Autor creado con id: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        throw fromPostgresError(err, { email });
    }
}));

// ================================
// PUT /api/authors/:id - Actualizar un autor
// ================================
authorsRouter.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const name = sanitizeHtml(req.body.name?.trim());
    const email = req.body.email?.trim().toLowerCase();     // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
    const bio = sanitizeHtml(req.body.bio?.trim()) || null; // Si bio no se envía, lo dejamos como null

    const validationError = validateAuthorFields(name, email);
    if (validationError) throw badRequest(validationError);

    try {
        const result = await pool.query(
            `UPDATE authors SET name = $1, email = $2, bio = $3 WHERE id = $4 RETURNING *`,
            [name, email, bio, id]
        );

        if (result.rows.length === 0) throw notFound('Autor no encontrado');

        console.log(`[PUT /api/authors/:id] Autor actualizado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.statusCode) throw err; // re-lanza errores ya procesados (notFound)
        throw fromPostgresError(err, { email });
    }
}));

// ================================
// DELETE /api/authors/:id - Eliminar un autor
// ================================
authorsRouter.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw badRequest(MESSAGES.INVALID_ID);

    const result = await pool.query('DELETE FROM authors WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) throw notFound('Autor no encontrado');

    console.log(`[DELETE /api/authors/:id] Autor eliminado con id: ${id}`);
    res.status(204).send();
}));

export default authorsRouter;