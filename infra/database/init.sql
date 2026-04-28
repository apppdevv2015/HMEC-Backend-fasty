-- HME Intelligence System - Initial Schema
-- Targets: Machines, Components, and Health Logs

-- Machines Table (e.g., CAT 777 Dump Truck)
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "TRK-001"
    model VARCHAR(50) NOT NULL, -- e.g., "CAT 777"
    site_id VARCHAR(50) NOT NULL,
    current_mhi DECIMAL(5,2) DEFAULT 100.00,
    status VARCHAR(20) DEFAULT 'Healthy',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Components Table (Engine, Transmission, etc.)
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL, -- e.g., "engine", "tyre"
    serial_number VARCHAR(100),
    health_score DECIMAL(5,2) DEFAULT 100.00,
    wear_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_service_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(machine_id, component_type)
);

-- Component Health History (For trending and predictive analytics)
CREATE TABLE IF NOT EXISTS component_health_logs (
    id BIGSERIAL PRIMARY KEY,
    component_id UUID REFERENCES components(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    parameters JSONB, -- Stores the raw inputs (temp, pressure, etc.)
    operator_id VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_health_logs_recorded_at ON component_health_logs(recorded_at);

-- 1. Migration History Table
-- Tracks which schema updates have been applied
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. General Audit Log Table
-- Tracks WHO changed WHAT and WHEN (Critical for Production)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Trigger Function
-- Automatically populates audit_logs when data changes
CREATE OR REPLACE FUNCTION fn_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs(table_name, record_id, action, old_data, changed_by)
        VALUES (TG_RELNAME, OLD.id, TG_OP, to_jsonb(OLD), current_user);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_RELNAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs(table_name, record_id, action, new_data, changed_by)
        VALUES (TG_RELNAME, NEW.id, TG_OP, to_jsonb(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Audit Triggers to Critical Tables
CREATE TRIGGER trg_audit_machines AFTER INSERT OR UPDATE OR DELETE ON machines FOR EACH ROW EXECUTE FUNCTION fn_audit_log_changes();
CREATE TRIGGER trg_audit_components AFTER INSERT OR UPDATE OR DELETE ON components FOR EACH ROW EXECUTE FUNCTION fn_audit_log_changes();
