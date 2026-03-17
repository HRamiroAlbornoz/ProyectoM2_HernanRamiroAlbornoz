import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { MESSAGES } from '../src/validator.js';

// ================================
// Mock del pool de PostgreSQL
// Interceptamos todas las queries para no tocar la BD real
// ================================
vi.mock('../db/config.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn((cb) => cb(null, {}, vi.fn())),
    },
}));

import pool from '../db/config.js';

// ================================
// Datos de prueba reutilizables
// ================================
const mockAuthor = {
    id: 1,
    name: 'Hernán Ramírez',
    email: 'hernan@mail.com',
    bio: 'Desarrollador backend',
    created_at: new Date().toISOString(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ================================
// GET /api/authors
// ================================
describe('GET /api/authors', () => {

    it('debe retornar 200 y un array de autores', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockAuthor] });

        const res = await request(app).get('/api/authors');

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0]).toHaveProperty('email', 'hernan@mail.com');
    });

    it('debe retornar 200 con array vacío si no hay autores', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/authors');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('debe retornar 500 si la BD falla', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/authors');

        expect(res.status).toBe(500);
    });
});

// ================================
// GET /api/authors/:id
// ================================
describe('GET /api/authors/:id', () => {

    it('debe retornar 200 y el autor si existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockAuthor] });

        const res = await request(app).get('/api/authors/1');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
    });

    it('debe retornar 404 si el autor no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/authors/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Autor no encontrado');
    });

    it('debe retornar 400 si el id no es un número válido', async () => {
        const res = await request(app).get('/api/authors/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });

    it('debe retornar 400 si el id es 0', async () => {
        const res = await request(app).get('/api/authors/0');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });

    it('debe retornar 400 si el id es negativo', async () => {
        const res = await request(app).get('/api/authors/-5');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });
});

// ================================
// POST /api/authors
// ================================
describe('POST /api/authors', () => {

    it('debe retornar 201 y el autor creado', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockAuthor] });

        const res = await request(app)
            .post('/api/authors')
            .send({ name: 'Hernán Ramírez', email: 'hernan@mail.com', bio: 'Dev' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('debe retornar 400 si falta el name', async () => {
        const res = await request(app)
            .post('/api/authors')
            .send({ email: 'hernan@mail.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.NAME_REQUIRED);
    });

    it('debe retornar 400 si falta el email', async () => {
        const res = await request(app)
            .post('/api/authors')
            .send({ name: 'Hernán' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.EMAIL_REQUIRED);
    });

    it('debe retornar 400 si el email tiene formato inválido', async () => {
        const res = await request(app)
            .post('/api/authors')
            .send({ name: 'Hernán', email: 'no-es-un-email' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.EMAIL_INVALID_FORMAT);
    });

    it('debe retornar 400 si el name supera los 100 caracteres', async () => {
        const res = await request(app)
            .post('/api/authors')
            .send({ name: 'A'.repeat(101), email: 'hernan@mail.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.NAME_TOO_LONG);
    });

    it('debe retornar 409 si el email ya está registrado', async () => {
        const duplicateError = new Error('duplicate');
        duplicateError.code = '23505';
        pool.query.mockRejectedValueOnce(duplicateError);

        const res = await request(app)
            .post('/api/authors')
            .send({ name: 'Hernán', email: 'hernan@mail.com' });

        expect(res.status).toBe(409);
        expect(res.body.error).toContain('ya está registrado');
    });

    it('debe sanitizar etiquetas HTML en name y bio', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ ...mockAuthor, name: 'alert(hack)', bio: 'texto' }]
        });

        const res = await request(app)
            .post('/api/authors')
            .send({ name: "<script>alert('hack')</script>", email: 'test@mail.com', bio: '<b>texto</b>' });

        expect(res.status).toBe(201);
        const calledWith = pool.query.mock.calls[0][1];
        expect(calledWith[0]).not.toContain('<script>');
        expect(calledWith[2]).not.toContain('<b>');
    });
});

// ================================
// PUT /api/authors/:id
// ================================
describe('PUT /api/authors/:id', () => {

    it('debe retornar 200 y el autor actualizado', async () => {
        const updated = { ...mockAuthor, name: 'Nuevo Nombre' };
        pool.query.mockResolvedValueOnce({ rows: [updated] });

        const res = await request(app)
            .put('/api/authors/1')
            .send({ name: 'Nuevo Nombre', email: 'hernan@mail.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Nuevo Nombre');
    });

    it('debe retornar 404 si el autor no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/authors/999')
            .send({ name: 'Hernán', email: 'hernan@mail.com' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Autor no encontrado');
    });

    it('debe retornar 400 si el id es inválido', async () => {
        const res = await request(app)
            .put('/api/authors/abc')
            .send({ name: 'Hernán', email: 'hernan@mail.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });

    it('debe retornar 400 si falta el name', async () => {
        const res = await request(app)
            .put('/api/authors/1')
            .send({ email: 'hernan@mail.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.NAME_REQUIRED);
    });

    it('debe retornar 409 si el email ya está en uso', async () => {
        const duplicateError = new Error('duplicate');
        duplicateError.code = '23505';
        pool.query.mockRejectedValueOnce(duplicateError);

        const res = await request(app)
            .put('/api/authors/1')
            .send({ name: 'Hernán', email: 'otro@mail.com' });

        expect(res.status).toBe(409);
    });
});

// ================================
// DELETE /api/authors/:id
// ================================
describe('DELETE /api/authors/:id', () => {

    it('debe retornar 204 si el autor fue eliminado', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockAuthor] });

        const res = await request(app).delete('/api/authors/1');

        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
    });

    it('debe retornar 404 si el autor no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/authors/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Autor no encontrado');
    });

    it('debe retornar 400 si el id es inválido', async () => {
        const res = await request(app).delete('/api/authors/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });
});