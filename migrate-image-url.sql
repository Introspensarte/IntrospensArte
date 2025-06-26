
-- Migración para cambiar image_path por image_url
ALTER TABLE activities RENAME COLUMN image_path TO image_url;

-- Actualizar URLs existentes (opcional, solo si hay datos)
UPDATE activities 
SET image_url = 'https://via.placeholder.com/400x300/808080/FFFFFF?text=Actividad' 
WHERE image_url IS NULL OR image_url = '' OR NOT (image_url LIKE 'http%');
