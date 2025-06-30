
-- First, let's ensure the notifications table has the correct structure
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with correct structure (content instead of message)
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create bonus_history table if it doesn't exist
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

-- Drop and recreate trace assignment tables to fix column names
DROP TABLE IF EXISTS trace_assignment_users CASCADE;
DROP TABLE IF EXISTS trace_assignments CASCADE;

-- Create trace_assignments table with correct column name
CREATE TABLE trace_assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  assignment_date DATE NOT NULL,
  reason TEXT NOT NULL,
  traces_amount INTEGER NOT NULL,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create trace_assignment_users junction table
CREATE TABLE trace_assignment_users (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES trace_assignments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_history_created_at ON bonus_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trace_assignments_admin_id ON trace_assignments(admin_id);
CREATE INDEX IF NOT EXISTS idx_trace_assignment_users_assignment_id ON trace_assignment_users(assignment_id);
CREATE INDEX IF NOT EXISTS idx_trace_assignment_users_user_id ON trace_assignment_users(user_id);

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
