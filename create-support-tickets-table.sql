
-- Crear tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS support_tickets (
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
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type ON support_tickets(type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
