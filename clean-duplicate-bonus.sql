-- Remove duplicate registration bonuses, keeping only the earliest one for each user
WITH ranked_bonuses AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, type ORDER BY created_at ASC) as rn
  FROM bonus_history 
  WHERE type = 'registration'
)
DELETE FROM bonus_history 
WHERE id IN (
  SELECT id FROM ranked_bonuses WHERE rn > 1
);

-- Show remaining registration bonuses after cleanup
SELECT user_id, COUNT(*) as bonus_count 
FROM bonus_history 
WHERE type = 'registration' 
GROUP BY user_id 
ORDER BY user_id;
