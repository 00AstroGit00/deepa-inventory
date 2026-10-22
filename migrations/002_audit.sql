CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  operation_id UUID,
  prev_hash TEXT,
  row_hash TEXT
);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);

CREATE OR REPLACE FUNCTION audit_log_chain() RETURNS trigger AS $$
DECLARE last_hash TEXT;
BEGIN
  SELECT row_hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
  NEW.row_hash := encode(digest(
    COALESCE(last_hash,'GENESIS') || NEW.actor_id::text || NEW.occurred_at::text ||
    NEW.entity_type || NEW.entity_id::text || NEW.operation ||
    COALESCE(NEW.previous_state::text,'') || COALESCE(NEW.new_state::text,''), 'sha256'), 'hex');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_chain BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_chain();

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_log is append-only'; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
