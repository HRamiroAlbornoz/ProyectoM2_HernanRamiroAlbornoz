-- =========================
-- CREAR TABLAS
-- =========================

-- Tabla de autores
CREATE TABLE authors (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  bio        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de posts
CREATE TABLE posts (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  author_id  INTEGER NOT NULL,
  published  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);


-- =========================
-- DATOS DE PRUEBA (SEED)
-- =========================

-- Insertar autores
INSERT INTO authors (name, email, bio) VALUES
  ('María García', 'maria.garcia@email.com', 'Desarrolladora frontend apasionada por el diseño UX.'),
  ('Carlos López', 'carlos.lopez@email.com', 'Backend developer con experiencia en APIs REST.'),
  ('Ana Martínez', 'ana.martinez@email.com', 'Escritora técnica y entusiasta del open source.');

-- Insertar posts
INSERT INTO posts (title, content, author_id, published) VALUES
  ('Introducción a React', 'React es una librería de JavaScript para construir interfaces de usuario. En este post veremos los conceptos básicos como componentes, props y estado.', 1, true),
  ('CSS Grid vs Flexbox', 'Dos herramientas muy poderosas para maquetar en CSS. Aprenderemos cuándo usar cada una con ejemplos prácticos.', 1, false),
  ('Cómo construir una API REST', 'Una API REST permite comunicar el frontend con el backend. Veremos cómo crear endpoints con Express y conectarlos a una base de datos PostgreSQL.', 2, true),
  ('SQL para principiantes', 'Las bases de datos relacionales almacenan datos en tablas. En este post cubrimos SELECT, INSERT, UPDATE y DELETE con ejemplos reales.', 2, true),
  ('Variables de entorno en Node', 'Guardar credenciales en el código es peligroso. Aprende a usar dotenv para manejar variables de entorno de forma segura en tus proyectos.', 2, false),
  ('Git para equipos', 'Trabajar en equipo con Git requiere buenas prácticas. Veremos cómo usar ramas, pull requests y mensajes de commit claros para colaborar mejor.', 3, true),
  ('Cómo escribir documentación', 'La documentación es tan importante como el código. En este post aprenderemos a escribir un README útil y a documentar una API con OpenAPI/Swagger.', 3, false);