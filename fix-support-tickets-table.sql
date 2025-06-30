
-- Script completo para corregir la tabla support_tickets
-- Este script eliminará la tabla existente y creará una nueva con la estructura correcta

-- Eliminar la tabla existente si existe
DROP TABLE IF EXISTS support_tickets CASCADE;

-- Crear la tabla support_tickets con la estructura correcta
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'reclamo', 'sugerencia', 'problema', 'contacto'
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'in_progress', 'resolved', 'closed'
    admin_response TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_type ON support_tickets(type);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

-- Verificar que todas las demás tablas necesarias existen con la estructura correcta

-- Verificar y corregir tabla users si es necesario
DO $$
BEGIN
    -- Agregar columnas faltantes a users si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'rank') THEN
        ALTER TABLE users ADD COLUMN rank TEXT DEFAULT 'Alma en tránsito';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'medal') THEN
        ALTER TABLE users ADD COLUMN medal TEXT DEFAULT 'Bronce';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_traces') THEN
        ALTER TABLE users ADD COLUMN total_traces INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_words') THEN
        ALTER TABLE users ADD COLUMN total_words INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_activities') THEN
        ALTER TABLE users ADD COLUMN total_activities INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verificar y corregir tabla activities si es necesario
DO $$
BEGIN
    -- Renombrar wordCount a word_count si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'wordcount') THEN
        ALTER TABLE activities RENAME COLUMN wordcount TO word_count;
    END IF;
    
    -- Agregar word_count si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'word_count') THEN
        ALTER TABLE activities ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Cambiar tipo de columna date a timestamp si es necesario
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'date' AND data_type = 'date') THEN
        ALTER TABLE activities ALTER COLUMN date TYPE TIMESTAMP USING date::timestamp;
    END IF;
    
    -- Agregar columnas faltantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'traces') THEN
        ALTER TABLE activities ADD COLUMN traces INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'album') THEN
        ALTER TABLE activities ADD COLUMN album TEXT NOT NULL DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'arista') THEN
        ALTER TABLE activities ADD COLUMN arista TEXT NOT NULL DEFAULT 'introspección';
    END IF;
END $$;

-- Crear tabla bonus_history si no existe
CREATE TABLE IF NOT EXISTS bonus_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    traces INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'registration', 'birthday', 'admin_assignment', etc.
    assigned_by_id INTEGER,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (assigned_by_id) REFERENCES users (id)
);

-- Crear tabla notifications si no existe
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Crear tabla likes si no existe
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (activity_id) REFERENCES activities (id),
    UNIQUE(user_id, activity_id)
);

-- Crear tabla comments si no existe
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (activity_id) REFERENCES activities (id)
);

-- Agregar columnas faltantes a planned_activities si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planned_activities' AND column_name = 'deadline') THEN
        ALTER TABLE planned_activities ADD COLUMN deadline TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planned_activities' AND column_name = 'facebook_link') THEN
        ALTER TABLE planned_activities ADD COLUMN facebook_link TEXT;
    END IF;
END $$;

-- Crear índices adicionales para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_activity_id ON likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity_id ON comments(activity_id);

-- Mensaje de confirmación
SELECT 'Base de datos corregida exitosamente. Tabla support_tickets recreada con estructura correcta.' as resultado;
