-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Custom Enums
CREATE TYPE redline_status AS ENUM (
    'proposed',
    'accepted',
    'rejected',
    'counter_proposed',
    'withdrawn'
);

CREATE TYPE contract_party_role AS ENUM (
    'landlord',
    'tenant',
    'legal_counsel',
    'mediator'
);

-- 3. Base Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    effective_date DATE,
    expiry_date DATE,
    notice_period_days INT DEFAULT 180,
    renewal_notice_deadline DATE GENERATED ALWAYS AS (
        expiry_date - (notice_period_days || ' days')::INTERVAL
    ) STORED,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    final_pdf_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Contract Chunks & Embeddings
CREATE TABLE IF NOT EXISTS contract_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INT,
    section_header TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_chunks_embedding 
ON contract_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 5. Contract Participants
CREATE TABLE IF NOT EXISTS contract_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role contract_party_role NOT NULL,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (contract_id, user_id)
);

-- 6. Redline Proposals & Counters
CREATE TABLE IF NOT EXISTS contract_redlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    field_path TEXT NOT NULL,
    statutory_reference TEXT,
    legal_violation TEXT,
    original_clause_text TEXT,
    proposed_clause_text TEXT NOT NULL,
    current_clause_text TEXT NOT NULL,
    status redline_status DEFAULT 'proposed' NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Negotiation Events
CREATE TABLE IF NOT EXISTS redline_negotiation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redline_id UUID NOT NULL REFERENCES contract_redlines(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    actor_role contract_party_role NOT NULL,
    action redline_status NOT NULL,
    counter_clause_text TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS contract_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    redline_id UUID REFERENCES contract_redlines(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notifications & Telegram Authentication
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    milestone_days INT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_alert_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    milestone_days INT NOT NULL,
    recipient_email TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (contract_id, alert_type, milestone_days, recipient_email)
);

CREATE TABLE IF NOT EXISTS user_telegram_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    telegram_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Vector Match RPC Function
CREATE OR REPLACE FUNCTION match_contract_chunks (
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_user_id uuid
)
RETURNS TABLE (
    id uuid,
    contract_id uuid,
    content text,
    page_number int,
    section_header text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.contract_id,
        cc.content,
        cc.page_number,
        cc.section_header,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM contract_chunks cc
    JOIN contract_participants cp ON cp.contract_id = cc.contract_id
    WHERE cp.user_id = p_user_id
      AND 1 - (cc.embedding <=> query_embedding) > match_threshold
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
