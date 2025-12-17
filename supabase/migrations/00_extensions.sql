-- ============================================
-- Extensions PostgreSQL requises
-- CRM Axivity - Supabase
-- ============================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full text search (français)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Pour les calculs de distance temporelle
CREATE EXTENSION IF NOT EXISTS "btree_gist";
