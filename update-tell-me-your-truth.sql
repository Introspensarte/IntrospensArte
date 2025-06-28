
-- Actualizar la actividad "Tell me Your Truth" para que aparezca en "Actividad Inicial"
UPDATE planned_activities 
SET album = 'actividad-inicial'
WHERE title = 'Tell me Your Truth' 
   OR title LIKE '%Tell me Your Truth%'
   OR title LIKE '%Tell me your truth%'
   OR title LIKE '%tell me your truth%';

-- Verificar que la actualización se realizó correctamente
SELECT id, title, album, arista, created_at 
FROM planned_activities 
WHERE title LIKE '%Tell me%truth%' 
   OR title LIKE '%Tell me Your Truth%';
