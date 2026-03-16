const { loadEnvFile } = require('node:process');
loadEnvFile('.env');
const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// ================================
// GET /api/authors - Listar todos los autores
// ================================
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM authors ORDER BY created_at DESC'
        );
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
});

// ================================
// GET /api/authors/:id - Detalle de un autor
// ================================
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM authors WHERE id = $1',
            [id]
        );

        // Si no se encontró ningún autor con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// POST /api/authors - Crear un autor
// ================================
router.post('/', async (req, res, next) => {
    try {
        const { name, email, bio } = req.body;

        // Validación: name y email son obligatorios
        if (!name || !email) {
            return res.status(400).json({ error: 'Los campos name y email son obligatorios' });
        }

        const result = await pool.query(
            'INSERT INTO authors (name, email, bio) VALUES ($1, $2, $3) RETURNING *',
            [name, email, bio]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// PUT /api/authors/:id - Actualizar un autor
// ================================
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, bio } = req.body;

        // Validación: name y email son obligatorios
        if (!name || !email) {
            return res.status(400).json({ error: 'Los campos name y email son obligatorios' });
        }

        const result = await pool.query(
            `UPDATE authors 
       SET name = $1, email = $2, bio = $3 
       WHERE id = $4 
       RETURNING *`,
            [name, email, bio, id]
        );

        // Si no se encontró ningún autor con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ================================
// DELETE /api/authors/:id - Eliminar un autor
// ================================
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM authors WHERE id = $1 RETURNING *',
            [id]
        );

        // Si no se encontró ningún autor con ese id
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;