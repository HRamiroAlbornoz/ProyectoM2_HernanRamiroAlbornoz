// ================================
// src/errors.js
// Funciones helper para crear errores HTTP con statusCode
// ================================

/**
 * Crea un error estándar de JavaScript con statusCode adjunto
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
export function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// ================================
// Helpers por código HTTP
// ================================
export const badRequest = (msg) => createError(msg, 400);
export const unauthorized = (msg) => createError(msg, 401);
export const forbidden = (msg) => createError(msg, 403);
export const notFound = (msg) => createError(msg, 404);
export const conflict = (msg) => createError(msg, 409);
export const internal = (msg = 'Error interno del servidor') => createError(msg, 500);
export const unavailable = (msg = 'Servicio no disponible') => createError(msg, 503);

// ================================
// Mapeo de errores de PostgreSQL
// Convierte códigos de error de PG en errores HTTP con mensaje descriptivo
// ================================

/**
 * Convierte un error de PostgreSQL en un error HTTP apropiado
 * @param {Error} err - Error original de PostgreSQL
 * @param {Object} context - Datos contextuales para el mensaje (email, author_id, etc.)
 * @returns {Error}
 */
export function fromPostgresError(err, context = {}) {
    switch (err.code) {
        // Email o campo único duplicado
        case '23505':
            return conflict(
                context.email
                    ? `El email ${context.email} ya está registrado`
                    : 'Registro duplicado'
            );

        // author_id u otra FK no existe
        case '23503':
            return notFound(
                context.author_id
                    ? `No existe un autor con id ${context.author_id}`
                    : 'Violación de relación entre tablas'
            );

        // Campo NOT NULL enviado vacío
        case '23502':
            return badRequest('Campo requerido faltante');

        // Valor demasiado largo para el campo
        case '22001':
            return badRequest('El valor ingresado es demasiado largo');

        // Tipo de dato incorrecto
        case '22P02':
            return badRequest('Tipo de dato inválido');

        // PostgreSQL no disponible
        case 'ECONNREFUSED':
            return unavailable('No se puede conectar a la base de datos');

        // Error no mapeado — lo devuelve sin modificar para que el errorHandler lo maneje
        default:
            return err;
    }
}