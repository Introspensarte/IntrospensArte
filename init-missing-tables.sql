
-- Crear tablas faltantes para likes y comentarios
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (activity_id) REFERENCES activities (id),
  UNIQUE(user_id, activity_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (activity_id) REFERENCES activities (id)
);

-- Agregar columnas faltantes a planned_activities
ALTER TABLE planned_activities 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS facebook_link TEXT;
