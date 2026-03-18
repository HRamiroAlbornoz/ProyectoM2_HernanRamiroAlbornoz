// ================================
// src/asyncHandler.js
// Wrapper para funciones async en rutas Express
// Elimina la necesidad de try/catch en cada ruta
// ================================

/**
 * Envuelve una función async de Express y captura cualquier error,
 * pasándolo automáticamente a next() para que lo maneje el errorHandler
 *
 * Sin asyncHandler:
 *   router.get('/', async (req, res, next) => {
 *       try { ... } catch (err) { next(err); }
 *   });
 *
 * Con asyncHandler:
 *   router.get('/', asyncHandler(async (req, res) => {
 *       ...  // los errores se propagan automáticamente
 *   }));
 *
 * @param {Function} fn - Función async del handler de Express
 * @returns {Function} - Handler con captura de errores automática
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}