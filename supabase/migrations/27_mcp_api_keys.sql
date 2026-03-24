-- ============================================
-- Migration: MCP API Keys
-- Table pour stocker les clés d'API du serveur MCP
-- Chaque clé est liée à un profil utilisateur
-- ============================================

CREATE TABLE IF NOT EXISTS mcp_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,               -- Description (ex: "Claude Desktop - Pierre")
  key_hash TEXT NOT NULL UNIQUE,     -- SHA-256 du key (jamais stocké en clair)
  revoked BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour la recherche rapide par hash
CREATE INDEX idx_mcp_api_keys_hash ON mcp_api_keys(key_hash) WHERE NOT revoked;

-- Index pour lister les clés d'un user
CREATE INDEX idx_mcp_api_keys_user ON mcp_api_keys(user_id);

-- Trigger updated_at
CREATE TRIGGER set_mcp_api_keys_updated_at
  BEFORE UPDATE ON mcp_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: seul l'admin peut gérer les clés
ALTER TABLE mcp_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_mcp_keys" ON mcp_api_keys
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Un user peut voir ses propres clés (mais pas les créer/supprimer)
CREATE POLICY "user_read_own_keys" ON mcp_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);
