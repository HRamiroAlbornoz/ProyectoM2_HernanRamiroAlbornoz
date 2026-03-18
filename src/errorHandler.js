// ================================
// src/errorHandler.js
// Middleware central de manejo de errores
// Debe registrarse SIEMPRE AL FINAL en app.js
// ================================

/**
 * Middleware de errores de Express (4 parámetros obligatorios)
 * Centraliza logging, formato de respuesta y control de exposición del stack
 */
export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';

    // ================================
    // Logging estructurado
    // ================================
    const logData = {
        status: statusCode,
        message: message,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
    };

    if (statusCode >= 500) {
        // Errores de servidor — loguear con stack completo
        console.error('Error de servidor:', { ...logData, stack: err.stack });
    } else {
        // Errores de cliente (4xx) — solo el mensaje, sin stack
        console.warn('Error de cliente:', logData);
    }

    // ================================
    // Respuesta al cliente
    // ================================
    const response = {
        error: message,
        status: statusCode,
    };

    // Solo en desarrollo exponemos el stack trace
    // Nunca exponer detalles internos en producción
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}