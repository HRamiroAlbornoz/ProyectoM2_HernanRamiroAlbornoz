import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// ================================
// Mock del pool de PostgreSQL
// ================================
vi.mock('../db/config.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn((cb) => cb(null, {}, vi.fn())),
    },
}));

// ================================
// GET / - Ruta raíz
// ================================
describe('GET /', () => {

    it('debe retornar 200 con el mensaje de bienvenida', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'MiniBlog API');
    });

    it('debe retornar los endpoints disponibles', async () => {
        const res = await request(app).get('/');

        expect(res.body).toHaveProperty('endpoints');
        expect(res.body.endpoints).toHaveProperty('authors', '/api/authors');
        expect(res.body.endpoints).toHaveProperty('posts', '/api/posts');
    });
});

// ================================
// Rutas inexistentes - 404
// ================================
describe('Rutas inexistentes', () => {

    it('debe retornar 404 para una ruta GET inexistente', async () => {
        const res = await request(app).get('/ruta-que-no-existe');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toContain('/ruta-que-no-existe');
    });

    it('debe retornar 404 para una ruta POST inexistente', async () => {
        const res = await request(app).post('/ruta-que-no-existe');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('debe retornar 404 para una ruta PUT inexistente', async () => {
        const res = await request(app).put('/ruta-que-no-existe');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('debe retornar 404 para una ruta DELETE inexistente', async () => {
        const res = await request(app).delete('/ruta-que-no-existe');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('debe retornar 404 para rutas anidadas inexistentes', async () => {
        const res = await request(app).get('/api/recurso-inexistente');

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('/api/recurso-inexistente');
    });
});

// ================================
// Body JSON inválido
// ================================
describe('Body JSON inválido', () => {

    it('debe retornar 400 si el body no es JSON válido', async () => {
        const res = await request(app)
            .post('/api/authors')
            .set('Content-Type', 'application/json')
            .send('{ esto no es json }');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});