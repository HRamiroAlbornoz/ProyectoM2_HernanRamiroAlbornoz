import { describe, it, expect } from 'vitest';
import {
    isValidId,
    isValidEmail,
    sanitizeHtml,
    validateAuthorFields,
    validatePostFields,
    MESSAGES,
    LIMITS,
} from '../src/validator.js';

// ================================
// isValidId
// ================================
describe('isValidId', () => {

    // --- Casos válidos ---
    it('debe retornar true para un entero positivo', () => {
        expect(isValidId(1)).toBe(true);
        expect(isValidId(99)).toBe(true);
    });

    it('debe retornar true para string numérico entero positivo', () => {
        expect(isValidId('5')).toBe(true);
        expect(isValidId('100')).toBe(true);
    });

    // --- Casos inválidos básicos ---
    it('debe retornar false para 0', () => {
        expect(isValidId(0)).toBe(false);
    });

    it('debe retornar false para números negativos', () => {
        expect(isValidId(-1)).toBe(false);
        expect(isValidId(-100)).toBe(false);
    });

    it('debe retornar false para strings no numéricos', () => {
        expect(isValidId('abc')).toBe(false);
        expect(isValidId('')).toBe(false);
    });

    it('debe retornar false para decimales', () => {
        expect(isValidId(1.5)).toBe(false);
        expect(isValidId('2.9')).toBe(false);
    });

    it('debe retornar false para null y undefined', () => {
        expect(isValidId(null)).toBe(false);
        expect(isValidId(undefined)).toBe(false);
    });

    // --- Edge cases ---
    it('debe retornar false para Infinity', () => {
        expect(isValidId(Infinity)).toBe(false);
        expect(isValidId(-Infinity)).toBe(false);
    });

    it('debe retornar false para NaN', () => {
        expect(isValidId(NaN)).toBe(false);
    });

    it('debe retornar false para arrays', () => {
        expect(isValidId([])).toBe(false);
        expect(isValidId([1])).toBe(false);
    });

    it('debe retornar false para objetos', () => {
        expect(isValidId({})).toBe(false);
        expect(isValidId({ id: 1 })).toBe(false);
    });

    it('debe retornar false para booleanos', () => {
        expect(isValidId(true)).toBe(false);
        expect(isValidId(false)).toBe(false);
    });
});

// ================================
// isValidEmail
// ================================
describe('isValidEmail', () => {

    // --- Casos válidos ---
    it('debe retornar true para emails válidos', () => {
        expect(isValidEmail('hernan@mail.com')).toBe(true);
        expect(isValidEmail('user.name+tag@domain.org')).toBe(true);
        expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('debe retornar true para emails con subdominio', () => {
        expect(isValidEmail('user@mail.domain.com')).toBe(true);
        expect(isValidEmail('user@sub.domain.org')).toBe(true);
    });

    it('debe retornar true para emails en mayúsculas', () => {
        // Las rutas hacen .toLowerCase() antes de validar,
        // pero el validador en sí debería aceptarlos igual
        expect(isValidEmail('HERNAN@MAIL.COM')).toBe(true);
        expect(isValidEmail('User@Domain.Org')).toBe(true);
    });

    // --- Casos inválidos básicos ---
    it('debe retornar false si falta el @', () => {
        expect(isValidEmail('hernanemail.com')).toBe(false);
    });

    it('debe retornar false si falta el dominio', () => {
        expect(isValidEmail('hernan@')).toBe(false);
    });

    it('debe retornar false si falta la extensión', () => {
        expect(isValidEmail('hernan@mail')).toBe(false);
    });

    it('debe retornar false para string vacío', () => {
        expect(isValidEmail('')).toBe(false);
    });

    it('debe retornar false si hay espacios', () => {
        expect(isValidEmail('her nan@mail.com')).toBe(false);
        expect(isValidEmail('hernan @mail.com')).toBe(false);
    });

    // --- Edge cases ---
    it('debe retornar false para múltiples @', () => {
        expect(isValidEmail('a@b@c.com')).toBe(false);
    });

    it('debe retornar false para solo espacios en blanco', () => {
        expect(isValidEmail('   ')).toBe(false);
    });

    it('debe retornar true para email largo pero con formato válido', () => {
        // isValidEmail solo valida formato, no longitud
        // el límite de 150 caracteres lo controla validateAuthorFields
        const longEmail = 'a'.repeat(145) + '@b.com';
        expect(isValidEmail(longEmail)).toBe(true);
    });
});

// ================================
// sanitizeHtml
// ================================
describe('sanitizeHtml', () => {

    // --- Casos básicos ---
    it('debe eliminar etiquetas script', () => {
        expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("alert('xss')");
    });

    it('debe eliminar etiquetas HTML genéricas', () => {
        expect(sanitizeHtml('<b>texto</b>')).toBe('texto');
        expect(sanitizeHtml('<h1>título</h1>')).toBe('título');
        expect(sanitizeHtml('<p class="x">párrafo</p>')).toBe('párrafo');
    });

    it('debe retornar el texto sin cambios si no hay etiquetas', () => {
        expect(sanitizeHtml('texto limpio')).toBe('texto limpio');
    });

    it('debe retornar null si recibe null', () => {
        expect(sanitizeHtml(null)).toBe(null);
    });

    it('debe retornar undefined si recibe undefined', () => {
        expect(sanitizeHtml(undefined)).toBe(undefined);
    });

    it('debe convertir números a string y sanitizarlos', () => {
        expect(sanitizeHtml(123)).toBe('123');
    });

    it('debe manejar etiquetas anidadas', () => {
        expect(sanitizeHtml('<div><p>texto</p></div>')).toBe('texto');
    });

    // --- Edge cases ---
    it('debe retornar string vacío si recibe string vacío', () => {
        expect(sanitizeHtml('')).toBe('');
    });

    it('debe retornar solo espacios si recibe solo espacios', () => {
        expect(sanitizeHtml('   ')).toBe('   ');
    });

    it('debe dejar intactas las tags malformadas sin cierre', () => {
        // La regex /<[^>]*>/g solo elimina lo que está entre < y >
        // Si no hay >, no hay match y el texto queda intacto
        expect(sanitizeHtml('<script')).toBe('<script');
        expect(sanitizeHtml('texto<b')).toBe('texto<b');
    });

    it('debe eliminar atributos con contenido malicioso', () => {
        expect(sanitizeHtml('<img onerror="alert(1)" src="x">')).toBe('');
        expect(sanitizeHtml('<a href="javascript:void(0)">click</a>')).toBe('click');
    });

    it('debe manejar múltiples tags en cadena', () => {
        expect(sanitizeHtml('<b><i>texto</i></b>')).toBe('texto');
        expect(sanitizeHtml('<div><span><p>profundo</p></span></div>')).toBe('profundo');
    });

    it('debe eliminar tags pero conservar el texto mixto', () => {
        expect(sanitizeHtml('hola <b>mundo</b> !')).toBe('hola mundo !');
    });
});

// ================================
// validateAuthorFields
// ================================
describe('validateAuthorFields', () => {

    // --- Casos válidos ---
    it('debe retornar null si name y email son válidos', () => {
        expect(validateAuthorFields('Hernán', 'hernan@mail.com')).toBeNull();
    });

    it('debe aceptar name con exactamente el límite máximo de caracteres', () => {
        const maxName = 'A'.repeat(LIMITS.AUTHOR_NAME_MAX);
        expect(validateAuthorFields(maxName, 'hernan@mail.com')).toBeNull();
    });

    it('debe aceptar email con exactamente el límite máximo de caracteres', () => {
        // Construimos un email válido de exactamente AUTHOR_EMAIL_MAX caracteres
        const localPart = 'a'.repeat(LIMITS.AUTHOR_EMAIL_MAX - 9); // -9 por "@mail.com"
        const maxEmail = localPart + '@mail.com';
        expect(validateAuthorFields('Hernán', maxEmail)).toBeNull();
    });

    it('debe aceptar ambos campos en sus límites exactos simultáneamente', () => {
        const maxName = 'A'.repeat(LIMITS.AUTHOR_NAME_MAX);
        const maxEmail = 'a'.repeat(LIMITS.AUTHOR_EMAIL_MAX - 9) + '@mail.com';
        expect(validateAuthorFields(maxName, maxEmail)).toBeNull();
    });

    // --- Casos inválidos de name ---
    it('debe retornar error si name está vacío', () => {
        expect(validateAuthorFields('', 'hernan@mail.com')).toBe(MESSAGES.NAME_REQUIRED);
    });

    it('debe retornar error si name es null', () => {
        expect(validateAuthorFields(null, 'hernan@mail.com')).toBe(MESSAGES.NAME_REQUIRED);
    });

    it('debe retornar error si name es undefined', () => {
        expect(validateAuthorFields(undefined, 'hernan@mail.com')).toBe(MESSAGES.NAME_REQUIRED);
    });

    it('debe retornar error si name supera el límite de caracteres', () => {
        const longName = 'A'.repeat(LIMITS.AUTHOR_NAME_MAX + 1);
        expect(validateAuthorFields(longName, 'hernan@mail.com')).toBe(MESSAGES.NAME_TOO_LONG);
    });

    // --- Edge cases de name ---
    it('debe retornar null para name con solo espacios (el trim lo hace la ruta)', () => {
        // validateAuthorFields no hace trim — esa responsabilidad es de la ruta
        // '   ' no es falsy, por lo que pasa la validación de nombre
        expect(validateAuthorFields('   ', 'hernan@mail.com')).toBeNull();
    });

    // --- Casos inválidos de email ---
    it('debe retornar error si email está vacío', () => {
        expect(validateAuthorFields('Hernán', '')).toBe(MESSAGES.EMAIL_REQUIRED);
    });

    it('debe retornar error si email es null', () => {
        expect(validateAuthorFields('Hernán', null)).toBe(MESSAGES.EMAIL_REQUIRED);
    });

    it('debe retornar error si email es undefined', () => {
        expect(validateAuthorFields('Hernán', undefined)).toBe(MESSAGES.EMAIL_REQUIRED);
    });

    it('debe retornar error si email supera el límite de caracteres', () => {
        const longEmail = 'a'.repeat(LIMITS.AUTHOR_EMAIL_MAX - 8) + '@mail.com';
        expect(validateAuthorFields('Hernán', longEmail)).toBe(MESSAGES.EMAIL_TOO_LONG);
    });

    it('debe retornar error si el email tiene formato inválido', () => {
        expect(validateAuthorFields('Hernán', 'no-es-email')).toBe(MESSAGES.EMAIL_INVALID_FORMAT);
        expect(validateAuthorFields('Hernán', 'a@b@c.com')).toBe(MESSAGES.EMAIL_INVALID_FORMAT);
    });

    // --- Orden de prioridad ---
    it('debe validar name antes que email', () => {
        expect(validateAuthorFields('', 'no-es-email')).toBe(MESSAGES.NAME_REQUIRED);
    });

    it('debe validar largo de name antes que email', () => {
        const longName = 'A'.repeat(LIMITS.AUTHOR_NAME_MAX + 1);
        expect(validateAuthorFields(longName, '')).toBe(MESSAGES.NAME_TOO_LONG);
    });
});

// ================================
// validatePostFields
// ================================
describe('validatePostFields', () => {

    // --- Casos válidos ---
    it('debe retornar null si todos los campos son válidos', () => {
        expect(validatePostFields('Título', 'Contenido', 1, false)).toBeNull();
    });

    it('debe retornar null si published no se envía (undefined)', () => {
        expect(validatePostFields('Título', 'Contenido', 1, undefined)).toBeNull();
    });

    it('debe aceptar published como true o false', () => {
        expect(validatePostFields('Título', 'Contenido', 1, true)).toBeNull();
        expect(validatePostFields('Título', 'Contenido', 1, false)).toBeNull();
    });

    it('debe aceptar title con exactamente el límite máximo de caracteres', () => {
        const maxTitle = 'A'.repeat(LIMITS.POST_TITLE_MAX);
        expect(validatePostFields(maxTitle, 'Contenido', 1, false)).toBeNull();
    });

    it('debe aceptar content con exactamente el límite máximo de caracteres', () => {
        const maxContent = 'A'.repeat(LIMITS.POST_CONTENT_MAX);
        expect(validatePostFields('Título', maxContent, 1, false)).toBeNull();
    });

    it('debe aceptar todos los campos en sus límites exactos simultáneamente', () => {
        const maxTitle = 'A'.repeat(LIMITS.POST_TITLE_MAX);
        const maxContent = 'A'.repeat(LIMITS.POST_CONTENT_MAX);
        expect(validatePostFields(maxTitle, maxContent, 1, true)).toBeNull();
    });

    it('debe aceptar author_id como string numérico positivo', () => {
        // isValidId acepta strings numéricos, por lo que '1' es válido
        expect(validatePostFields('Título', 'Contenido', '1', false)).toBeNull();
    });

    // --- Casos inválidos de title ---
    it('debe retornar error si title está vacío', () => {
        expect(validatePostFields('', 'Contenido', 1, false)).toBe(MESSAGES.TITLE_REQUIRED);
    });

    it('debe retornar error si title es null', () => {
        expect(validatePostFields(null, 'Contenido', 1, false)).toBe(MESSAGES.TITLE_REQUIRED);
    });

    it('debe retornar error si title supera el límite de caracteres', () => {
        const longTitle = 'A'.repeat(LIMITS.POST_TITLE_MAX + 1);
        expect(validatePostFields(longTitle, 'Contenido', 1, false)).toBe(MESSAGES.TITLE_TOO_LONG);
    });

    // --- Casos inválidos de content ---
    it('debe retornar error si content está vacío', () => {
        expect(validatePostFields('Título', '', 1, false)).toBe(MESSAGES.CONTENT_REQUIRED);
    });

    it('debe retornar error si content es null', () => {
        expect(validatePostFields('Título', null, 1, false)).toBe(MESSAGES.CONTENT_REQUIRED);
    });

    it('debe retornar error si content supera el límite de caracteres', () => {
        const longContent = 'A'.repeat(LIMITS.POST_CONTENT_MAX + 1);
        expect(validatePostFields('Título', longContent, 1, false)).toBe(MESSAGES.CONTENT_TOO_LONG);
    });

    // --- Casos inválidos de author_id ---
    it('debe retornar error si author_id es null', () => {
        expect(validatePostFields('Título', 'Contenido', null, false)).toBe(MESSAGES.AUTHOR_ID_REQUIRED);
    });

    it('debe retornar error si author_id es undefined', () => {
        expect(validatePostFields('Título', 'Contenido', undefined, false)).toBe(MESSAGES.AUTHOR_ID_REQUIRED);
    });

    it('debe retornar error si author_id no es un entero positivo', () => {
        // -1 y 1.5 llegan a INVALID_AUTHOR_ID porque !(-1) y !(1.5) son false
        expect(validatePostFields('Título', 'Contenido', -1, false)).toBe(MESSAGES.INVALID_AUTHOR_ID);
        expect(validatePostFields('Título', 'Contenido', 1.5, false)).toBe(MESSAGES.INVALID_AUTHOR_ID);
    });

    it('debe retornar error de requerido si author_id es 0', () => {
        // !0 === true, por lo que 0 cae en AUTHOR_ID_REQUIRED antes de llegar a INVALID_AUTHOR_ID
        expect(validatePostFields('Título', 'Contenido', 0, false)).toBe(MESSAGES.AUTHOR_ID_REQUIRED);
    });

    // --- Edge cases de author_id ---
    it('debe retornar error si author_id es string no numérico', () => {
        expect(validatePostFields('Título', 'Contenido', 'abc', false)).toBe(MESSAGES.INVALID_AUTHOR_ID);
    });

    // --- Edge cases de published ---
    it('debe retornar error si published no es booleano', () => {
        expect(validatePostFields('Título', 'Contenido', 1, 'true')).toBe(MESSAGES.PUBLISHED_INVALID);
        expect(validatePostFields('Título', 'Contenido', 1, 1)).toBe(MESSAGES.PUBLISHED_INVALID);
        expect(validatePostFields('Título', 'Contenido', 1, 'si')).toBe(MESSAGES.PUBLISHED_INVALID);
    });

    it('debe retornar error si published es null', () => {
        // null !== undefined, por lo que entra en la validación de tipo
        expect(validatePostFields('Título', 'Contenido', 1, null)).toBe(MESSAGES.PUBLISHED_INVALID);
    });

    // --- Orden de prioridad ---
    it('debe validar en orden: title → content → author_id → published', () => {
        expect(validatePostFields('', '', null, 'mal')).toBe(MESSAGES.TITLE_REQUIRED);
        expect(validatePostFields('Título', '', null, 'mal')).toBe(MESSAGES.CONTENT_REQUIRED);
        expect(validatePostFields('Título', 'Contenido', null, 'mal')).toBe(MESSAGES.AUTHOR_ID_REQUIRED);
        expect(validatePostFields('Título', 'Contenido', 1, 'mal')).toBe(MESSAGES.PUBLISHED_INVALID);
    });
});