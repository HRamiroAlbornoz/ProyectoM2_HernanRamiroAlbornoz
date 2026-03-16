const { loadEnvFile } = require('node:process');
loadEnvFile('.env');

const pool = require('./config');

async function testConnection() {
  try {
    // Pide una conexión del pool
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');

    // Consulta simple para verificar que la base de datos responde
    const result = await client.query('SELECT NOW() AS fecha_actual');
    console.log('📅 Fecha y hora del servidor:', result.rows[0].fecha_actual);

    // Verificar que las tablas existen
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('⚠️  No se encontraron tablas. Ejecuta db/setup.sql primero.');
    } else {
      console.log('📋 Tablas encontradas:');
      tables.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }

    // Devuelve el cliente al pool cuando termina
    client.release();

  } catch (err) {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
  } finally {
    // Cierra el pool al terminar el script
    await pool.end();
  }
}

testConnection();