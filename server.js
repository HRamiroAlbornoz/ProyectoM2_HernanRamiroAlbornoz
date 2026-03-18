import { loadEnvFile } from 'node:process';
import app from './src/app.js';

loadEnvFile('.env');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});