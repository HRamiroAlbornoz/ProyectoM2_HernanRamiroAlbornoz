const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verificar que la conexión funciona al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err.message);
  } else {
    console.log('Conexión a PostgreSQL exitosa');
    release(); // Devuelve el cliente al pool cuando termina
  }
});

module.exports = pool;