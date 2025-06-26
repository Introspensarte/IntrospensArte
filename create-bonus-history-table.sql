
-- Create bonus_history table
CREATE TABLE IF NOT EXISTS bonus_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  traces INTEGER NOT NULL,
  type TEXT NOT NULL,
  assigned_by_id INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_history_created_at ON bonus_history(created_at DESC);

-- Add registration bonus for existing users who don't have it yet
INSERT INTO bonus_history (user_id, title, traces, type, reason, created_at)
SELECT 
  id,
  'Bonus de Registro',
  50,
  'registration',
  'Bonificación por crear una cuenta en Introspens/arte',
  created_at
FROM users 
WHERE id NOT IN (
  SELECT user_id 
  FROM bonus_history 
  WHERE type = 'registration'
);
