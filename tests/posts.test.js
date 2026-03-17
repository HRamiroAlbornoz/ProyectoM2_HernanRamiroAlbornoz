import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { MESSAGES } from '../src/validator.js';

// ================================
// Mock del pool de PostgreSQL
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
const mockPost = {
    id: 1,
    title: 'Mi primer post',
    content: 'Contenido del post',
    author_id: 1,
    published: false,
    created_at: new Date().toISOString(),
};

const mockPostWithAuthor = {
    ...mockPost,
    author_name: 'Hernán Ramírez',
    author_email: 'hernan@mail.com',
    author_bio: 'Dev',
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ================================
// GET /api/posts
// ================================
describe('GET /api/posts', () => {

    it('debe retornar 200 y un array de posts', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockPost] });

        const res = await request(app).get('/api/posts');

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0]).toHaveProperty('title', 'Mi primer post');
    });

    it('debe retornar 200 con array vacío si no hay posts', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/posts');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('debe retornar 500 si la BD falla', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/posts');

        expect(res.status).toBe(500);
    });
});

// ================================
// GET /api/posts/author/:authorId
// ================================
describe('GET /api/posts/author/:authorId', () => {

    it('debe retornar 200 y posts del autor con sus datos', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockPostWithAuthor] });

        const res = await request(app).get('/api/posts/author/1');

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0]).toHaveProperty('author_name', 'Hernán Ramírez');
    });

    it('debe retornar 404 si el autor no tiene posts', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/posts/author/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'No se encontraron posts para este autor');
    });

    it('debe retornar 400 si el authorId es inválido', async () => {
        const res = await request(app).get('/api/posts/author/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_AUTHOR_ID);
    });
});

// ================================
// GET /api/posts/:id
// ================================
describe('GET /api/posts/:id', () => {

    it('debe retornar 200 y el post si existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockPost] });

        const res = await request(app).get('/api/posts/1');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
    });

    it('debe retornar 404 si el post no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/posts/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Post no encontrado');
    });

    it('debe retornar 400 si el id no es un número válido', async () => {
        const res = await request(app).get('/api/posts/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });

    it('debe retornar 400 si el id es 0', async () => {
        const res = await request(app).get('/api/posts/0');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });
});

// ================================
// POST /api/posts
// ================================
describe('POST /api/posts', () => {

    it('debe retornar 201 y el post creado', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockPost] });

        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Mi primer post', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('debe retornar 400 si falta el title', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.TITLE_REQUIRED);
    });

    it('debe retornar 400 si falta el content', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', author_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.CONTENT_REQUIRED);
    });

    it('debe retornar 400 si falta el author_id', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', content: 'Contenido' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.AUTHOR_ID_REQUIRED);
    });

    it('debe retornar 400 si el author_id no es un entero positivo', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', content: 'Contenido', author_id: -1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_AUTHOR_ID);
    });

    it('debe retornar 400 si published no es booleano', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', content: 'Contenido', author_id: 1, published: 'si' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.PUBLISHED_INVALID);
    });

    it('debe retornar 400 si el title supera los 200 caracteres', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'A'.repeat(201), content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.TITLE_TOO_LONG);
    });

    it('debe retornar 404 si el author_id no existe en la BD', async () => {
        const fkError = new Error('fk violation');
        fkError.code = '23503';
        pool.query.mockRejectedValueOnce(fkError);

        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', content: 'Contenido', author_id: 999 });

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('No existe un autor con id');
    });

    it('debe sanitizar etiquetas HTML en title y content', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ ...mockPost, title: 'alert(xss)', content: 'texto' }]
        });

        const res = await request(app)
            .post('/api/posts')
            .send({
                title: "<script>alert('xss')</script>",
                content: '<b>texto</b>',
                author_id: 1,
            });

        expect(res.status).toBe(201);
        const calledWith = pool.query.mock.calls[0][1];
        expect(calledWith[0]).not.toContain('<script>');
        expect(calledWith[1]).not.toContain('<b>');
    });

    it('debe usar published=false por defecto si no se envía', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ ...mockPost, published: false }] });

        const res = await request(app)
            .post('/api/posts')
            .send({ title: 'Título', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(201);
        const calledWith = pool.query.mock.calls[0][1];
        expect(calledWith[3]).toBe(false); // published en posición $4
    });
});

// ================================
// PUT /api/posts/:id
// ================================
describe('PUT /api/posts/:id', () => {

    it('debe retornar 200 y el post actualizado', async () => {
        const updated = { ...mockPost, title: 'Título actualizado' };
        pool.query.mockResolvedValueOnce({ rows: [updated] });

        const res = await request(app)
            .put('/api/posts/1')
            .send({ title: 'Título actualizado', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('title', 'Título actualizado');
    });

    it('debe retornar 404 si el post no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/posts/999')
            .send({ title: 'Título', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Post no encontrado');
    });

    it('debe retornar 400 si el id es inválido', async () => {
        const res = await request(app)
            .put('/api/posts/abc')
            .send({ title: 'Título', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });

    it('debe retornar 400 si los campos son inválidos', async () => {
        const res = await request(app)
            .put('/api/posts/1')
            .send({ title: '', content: 'Contenido', author_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.TITLE_REQUIRED);
    });

    it('debe retornar 404 si el author_id no existe en la BD', async () => {
        const fkError = new Error('fk violation');
        fkError.code = '23503';
        pool.query.mockRejectedValueOnce(fkError);

        const res = await request(app)
            .put('/api/posts/1')
            .send({ title: 'Título', content: 'Contenido', author_id: 999 });

        expect(res.status).toBe(404);
    });
});

// ================================
// DELETE /api/posts/:id
// ================================
describe('DELETE /api/posts/:id', () => {

    it('debe retornar 204 si el post fue eliminado', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockPost] });

        const res = await request(app).delete('/api/posts/1');

        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
    });

    it('debe retornar 404 si el post no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/posts/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Post no encontrado');
    });

    it('debe retornar 400 si el id es inválido', async () => {
        const res = await request(app).delete('/api/posts/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', MESSAGES.INVALID_ID);
    });
});