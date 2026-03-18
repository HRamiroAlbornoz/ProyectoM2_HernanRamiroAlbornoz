import pg from 'pg';

const { Pool } = pg;

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }, // requerido por Railway
        }
        : {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        }
);

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a PostgreSQL:', err.message);
    } else {
        console.log('Conexión a PostgreSQL exitosa');
        release();
    }
});

export default pool;