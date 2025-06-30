
-- Eliminar tabla existente
DROP TABLE IF EXISTS planned_activities CASCADE;

-- Crear nueva tabla de eventos del calendario
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('news', 'announcement', 'activity')),
    scheduled_date TIMESTAMP NOT NULL,
    published_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    visibility BOOLEAN DEFAULT TRUE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Campos específicos para actividades
    arista VARCHAR(100),
    album VARCHAR(100),
    deadline TIMESTAMP,
    facebook_link TEXT,
    description TEXT,
    
    -- Metadatos
    auto_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_calendar_events_scheduled_date ON calendar_events(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_author ON calendar_events(author_id);

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

-- Recrear tabla planned_activities si no existe
CREATE TABLE IF NOT EXISTS planned_activities (
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
