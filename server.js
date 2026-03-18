import { loadEnvFile } from 'node:process';
import app from './src/app.js';

// En desarrollo carga las variables desde .env
// En producción (Railway) las variables las inyecta la plataforma
try {
    loadEnvFile('.env');
} catch {
    // .env no existe en producción — ignoramos el error
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📄 Documentación disponible en http://localhost:${PORT}/api/docs`);
    }
});