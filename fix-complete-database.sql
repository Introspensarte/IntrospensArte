
-- Script completo para recrear toda la base de datos desde cero
-- IMPORTANTE: Esto eliminará TODOS los datos existentes

-- Eliminar todas las tablas existentes
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS bonus_history CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS planned_activities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    birthday DATE NOT NULL,
    face_claim TEXT NOT NULL,
    signature TEXT UNIQUE NOT NULL,
    motivation TEXT NOT NULL,
    facebook_link TEXT,
    role TEXT DEFAULT 'user',
    rank TEXT DEFAULT 'Alma en tránsito',
    medal TEXT DEFAULT 'Bronce',
    total_traces INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    total_activities INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de actividades
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    word_count INTEGER NOT NULL,
    type TEXT NOT NULL,
    responses INTEGER,
    link TEXT,
    image_url TEXT,
    description TEXT NOT NULL,
    arista TEXT NOT NULL,
    album TEXT NOT NULL,
    traces INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Crear tabla de noticias
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
);

-- Crear tabla de avisos
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
);

-- Crear tabla de actividades planificadas
CREATE TABLE planned_activities (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    arista TEXT NOT NULL,
    album TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    deadline TIMESTAMP,
    facebook_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
);

-- Crear tabla de notificaciones
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Crear tabla de likes
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (activity_id) REFERENCES activities (id),
    UNIQUE(user_id, activity_id)
);

-- Crear tabla de comentarios
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (activity_id) REFERENCES activities (id)
);

-- Crear tabla de historial de bonus
CREATE TABLE bonus_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    traces INTEGER NOT NULL,
    type TEXT NOT NULL,
    assigned_by_id INTEGER,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (assigned_by_id) REFERENCES users (id)
);

-- Crear tabla de tickets de soporte
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    admin_response TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de eventos del calendario
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('news', 'announcement', 'activity')),
    scheduled_date TIMESTAMP NOT NULL,
    published_date TIMESTAMP,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    visibility BOOLEAN DEFAULT TRUE,
    author_id INTEGER NOT NULL,
    
    -- Campos específicos para actividades
    arista TEXT,
    album TEXT,
    deadline TIMESTAMP,
    facebook_link TEXT,
    description TEXT,
    
    -- Metadatos
    auto_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES users (id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_news_created_at ON news(created_at);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_calendar_events_scheduled_date ON calendar_events(scheduled_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Función para auto-publicar eventos programados
CREATE OR REPLACE FUNCTION auto_publish_scheduled_events()
RETURNS INTEGER AS $$
DECLARE
    published_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Buscar eventos programados que deben publicarse
    FOR event_record IN 
        SELECT * FROM calendar_events 
        WHERE status = 'scheduled' 
        AND scheduled_date <= NOW()
        AND visibility = TRUE
    LOOP
        -- Publicar según el tipo de evento
        IF event_record.type = 'news' THEN
            INSERT INTO news (title, content, author_id, created_at)
            VALUES (event_record.title, event_record.content, event_record.author_id, event_record.scheduled_date);
        ELSIF event_record.type = 'announcement' THEN
            INSERT INTO announcements (title, content, author_id, created_at)
            VALUES (event_record.title, event_record.content, event_record.author_id, event_record.scheduled_date);
        ELSIF event_record.type = 'activity' THEN
            INSERT INTO planned_activities (title, description, arista, album, author_id, deadline, facebook_link, created_at)
            VALUES (event_record.title, event_record.description, event_record.arista, event_record.album, 
                   event_record.author_id, event_record.deadline, event_record.facebook_link, event_record.scheduled_date);
        END IF;
        
        -- Actualizar estado del evento
        UPDATE calendar_events 
        SET status = 'published', 
            published_date = NOW(),
            auto_published = TRUE,
            updated_at = NOW()
        WHERE id = event_record.id;
        
        published_count := published_count + 1;
    END LOOP;
    
    RETURN published_count;
END;
$$ LANGUAGE plpgsql;

-- Crear usuario administrador por defecto
INSERT INTO users (full_name, age, birthday, face_claim, signature, motivation, role) 
VALUES ('Administrador', 25, '1999-01-01', 'Admin', '#INELUDIBLE', 'Administrar el sistema', 'admin')
ON CONFLICT (signature) DO NOTHING;
