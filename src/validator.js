// ================================
// src/validator.js
// Centraliza toda la lógica de validación y sanitización de la aplicación
// ================================

// ================================
// Constantes de límites de campos
// ================================
export const LIMITS = {
    AUTHOR_NAME_MAX: 100,
    AUTHOR_EMAIL_MAX: 150,
    POST_TITLE_MAX: 200,
    POST_CONTENT_MAX: 5000,
};

// ================================
// Mensajes de error centralizados
// ================================
export const MESSAGES = {
    // Genéricos
    INVALID_ID: 'El id debe ser un número entero positivo',
    INVALID_AUTHOR_ID: 'El campo author_id debe ser un número entero positivo',

    // Autores
    NAME_REQUIRED: 'El campo name es obligatorio',
    NAME_TOO_LONG: `El campo name no puede superar los ${LIMITS.AUTHOR_NAME_MAX} caracteres`,
    EMAIL_REQUIRED: 'El campo email es obligatorio',
    EMAIL_TOO_LONG: `El campo email no puede superar los ${LIMITS.AUTHOR_EMAIL_MAX} caracteres`,
    EMAIL_INVALID_FORMAT: 'El formato del email no es válido',

    // Posts
    TITLE_REQUIRED: 'El campo title es obligatorio',
    TITLE_TOO_LONG: `El campo title no puede superar los ${LIMITS.POST_TITLE_MAX} caracteres`,
    CONTENT_REQUIRED: 'El campo content es obligatorio',
    CONTENT_TOO_LONG: `El campo content no puede superar los ${LIMITS.POST_CONTENT_MAX} caracteres`,
    AUTHOR_ID_REQUIRED: 'El campo author_id es obligatorio',
    PUBLISHED_INVALID: 'El campo published debe ser true o false',
};

// ================================
// Validaciones genéricas
// ================================

/**
 * Verifica que el id sea un número entero positivo
 * @param {*} id
 * @returns {boolean}
 */
export function isValidId(id) {
    // Rechaza explícitamente tipos que no sean number o string
    if (typeof id !== 'number' && typeof id !== 'string') return false;
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

/**
 * Verifica que el email tenga un formato válido
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Elimina etiquetas HTML para prevenir ataques XSS
 * Por ejemplo: "<script>alert('hack')</script>" → "alert('hack')"
 * Convierte a string explícitamente para evitar comportamiento inesperado con otros tipos
 * @param {*} text
 * @returns {string|null|undefined}
 */
export function sanitizeHtml(text) {
    if (text === null || text === undefined) return text;
    return String(text).replace(/<[^>]*>/g, '');
}

// ================================
// Validaciones de autores
// ================================

/**
 * Valida los campos obligatorios de un autor
 * Retorna un mensaje de error o null si todo está bien
 * @param {string} name
 * @param {string} email
 * @returns {string|null}
 */
export function validateAuthorFields(name, email) {
    if (!name) return MESSAGES.NAME_REQUIRED;
    if (name.length > LIMITS.AUTHOR_NAME_MAX) return MESSAGES.NAME_TOO_LONG;
    if (!email) return MESSAGES.EMAIL_REQUIRED;
    if (email.length > LIMITS.AUTHOR_EMAIL_MAX) return MESSAGES.EMAIL_TOO_LONG;
    if (!isValidEmail(email)) return MESSAGES.EMAIL_INVALID_FORMAT;
    return null;
}

// ================================
// Validaciones de posts
// ================================

/**
 * Valida los campos obligatorios de un post
 * Retorna un mensaje de error o null si todo está bien
 * @param {string} title
 * @param {string} content
 * @param {*} author_id
 * @param {boolean} published
 * @returns {string|null}
 */
export function validatePostFields(title, content, author_id, published) {
    if (!title) return MESSAGES.TITLE_REQUIRED;
    if (title.length > LIMITS.POST_TITLE_MAX) return MESSAGES.TITLE_TOO_LONG;
    if (!content) return MESSAGES.CONTENT_REQUIRED;
    if (content.length > LIMITS.POST_CONTENT_MAX) return MESSAGES.CONTENT_TOO_LONG;
    if (!author_id) return MESSAGES.AUTHOR_ID_REQUIRED;
    if (!isValidId(author_id)) return MESSAGES.INVALID_AUTHOR_ID;
    if (published !== undefined && typeof published !== 'boolean') return MESSAGES.PUBLISHED_INVALID;
    return null;
}