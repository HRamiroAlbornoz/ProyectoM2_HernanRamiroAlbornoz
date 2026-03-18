// ================================
// src/swagger.js
// Configuración de Swagger UI
// Lee y parsea el archivo openapi.yaml para servirlo
// como documentación interactiva en /api/docs
// ================================
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import swaggerUi from 'swagger-ui-express';

// Lee el archivo openapi.yaml desde la raíz del proyecto
const file = readFileSync('./openapi.yaml', 'utf8');
const swaggerDocument = parse(file);

export { swaggerUi, swaggerDocument };