const { loadEnvFile } = require('node:process');
loadEnvFile('.env');

const express = require('express');
const authorsRouter = express.Router();
const pool = require('../db/config');

// ================================
// Funciones auxiliares
// ================================

// Verifica que el id sea un número entero positivo
function isValidId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Verifica que el email tenga un formato válido
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Elimina etiquetas HTML para prevenir ataques XSS
// Por ejemplo: "<script>alert('hack')</script>" → "alert('hack')"
function sanitizeHtml(text) {
    if (!text) return text;
    return text.replace(/<[^>]*>/g, '');
}

// Valida los campos obligatorios de un autor
// Retorna un mensaje de error o null si todo está bien
function validateAuthorFields(name, email) {
    if (!name) {
        return 'El campo name es obligatorio';
    }
    if (name.length > 100) {
        return 'El campo name no puede superar los 100 caracteres';
    }
    if (!email) {
        return 'El campo email es obligatorio';
    }
    if (email.length > 150) {
        return 'El campo email no puede superar los 150 caracteres';
    }
    if (!isValidEmail(email)) {
        return 'El formato del email no es válido';
    }
    return null; // null significa que no hay errores
}

// ================================
// GET /api/authors - Listar todos los autores
// ================================
authorsRouter.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM authors ORDER BY created_at DESC'
        );
        console.log(`[GET /api/authors] ${result.rows.length} autores encontrados`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('[GET /api/authors] Error al listar autores:', err.message);
        next(err);
    }
});

// ================================
// GET /api/authors/:id - Detalle de un autor
// ================================
authorsRouter.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[GET /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        const result = await pool.query(
            'SELECT * FROM authors WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            console.error(`[GET /api/authors/:id] Autor no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        console.log(`[GET /api/authors/:id] Autor encontrado con id: ${id}`);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`[GET /api/authors/:id] Error al obtener autor con id ${req.params.id}:`, err.message);
        next(err);
    }
});

// ================================
// POST /api/authors - Crear un autor
// ================================
authorsRouter.post('/', async (req, res, next) => {
    try {
        // Sanitizamos name y bio para prevenir XSS
        const name = sanitizeHtml(req.body.name?.trim());
        const email = req.body.email?.trim().toLowerCase();     // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
        const bio = sanitizeHtml(req.body.bio?.trim()) || null; // Si bio no se envía, lo dejamos como null

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
// PUT /api/authors/:id - Actualizar un autor
// ================================
authorsRouter.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[PUT /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        // Sanitizamos name y bio para prevenir XSS
        const name = sanitizeHtml(req.body.name?.trim());
        const email = req.body.email?.trim().toLowerCase();     // Convertimos el email a minúsculas para evitar duplicados por mayúsculas
        const bio = sanitizeHtml(req.body.bio?.trim()) || null; // Si bio no se envía, lo dejamos como null

        const validationError = validateAuthorFields(name, email);
        if (validationError) {
            console.error(`[PUT /api/authors/:id] Validación fallida para id ${id}: ${validationError}`);
            return res.status(400).json({ error: validationError });
        }

        const result = await pool.query(
            `UPDATE authors 
       SET name = $1, email = $2, bio = $3 
       WHERE id = $4 
       RETURNING *`,
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
        console.error(`[PUT /api/authors/:id] Error al actualizar autor con id ${req.params.id}:`, err.message);
        next(err);
    }
});

// ================================
// DELETE /api/authors/:id - Eliminar un autor
// ================================
authorsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            console.error(`[DELETE /api/authors/:id] Id inválido recibido: ${id}`);
            return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
        }

        const result = await pool.query(
            'DELETE FROM authors WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            console.error(`[DELETE /api/authors/:id] Autor no encontrado con id: ${id}`);
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        console.log(`[DELETE /api/authors/:id] Autor eliminado con id: ${id}`);
        res.status(204).send();
    } catch (err) {
        console.error(`[DELETE /api/authors/:id] Error al eliminar autor con id ${req.params.id}:`, err.message);
        next(err);
    }
});

module.exports = authorsRouter;