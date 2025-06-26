

-- Agregar columna image_url a la tabla activities si no existe
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Actualizar actividades existentes que no tengan image_url
UPDATE activities 
SET image_url = '' 
WHERE image_url IS NULL;

