-- Migration 004: Inventory Exception Management System
-- Adds tables for tracking inventory exceptions, investigations, and resolutions

-- Exception classification enum
CREATE TYPE exception_class AS ENUM (
    'reconciled',
    'stock_shortage',
    'stock_excess',
    'recorded_loss',
    'unexplained_discrepancy',
    'potential_duplicate_movement',
    'invalid_data',
    'incomplete_reconciliation',
    'repeated_discrepancy',
    'unusual_movement_pattern'
);

-- Exception severity enum
CREATE TYPE exception_severity AS ENUM (
    'informational',
    'low',
    'medium',
    'high',
    'critical'
);

-- Investigation state enum
CREATE TYPE investigation_state AS ENUM (
    'open',
    'under_review',
    'awaiting_information',
    'resolved_explained',
    'corrected_adjustment',
    'closed_approved',
    'reopened'
);

-- Resolution type enum
CREATE TYPE resolution_type AS ENUM (
    'explained_no_change',
    'counting_error_corrected',
    'unit_product_error_corrected',
    'missing_movement_identified',
    'duplicate_movement_removed',
    'approved_adjustment',
    'unresolved_discrepancy',
    'incomplete_investigation'
);

-- Main inventory exceptions table
CREATE TABLE inventory_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_day_id UUID NOT NULL REFERENCES inventory_days(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    classification exception_class NOT NULL,
    severity exception_severity NOT NULL DEFAULT 'low',
    state investigation_state NOT NULL DEFAULT 'open',
    
    -- Variance details
    opening_qty NUMERIC(18,4) NOT NULL,
    expected_closing_qty NUMERIC(18,4) NOT NULL,
    physical_qty NUMERIC(18,4),
    variance_qty NUMERIC(18,4),
    unit TEXT NOT NULL,
    
    -- Financial impact (if cost data available)
    unit_cost NUMERIC(14,4),
    cost_unit TEXT,
    estimated_financial_impact NUMERIC(14,4),
    
    -- Related data
    expected_closing_movements JSONB,
    recorded_losses JSONB,
    physical_count_record JSONB,
    
    -- Recurrence tracking
    recurrence_count INT DEFAULT 1,
    first_detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Investigation tracking
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    first_reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_type resolution_type,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT unique_exception_per_product_per_day 
        UNIQUE (inventory_day_id, product_id, classification)
);

CREATE INDEX idx_exceptions_day ON inventory_exceptions (inventory_day_id);
CREATE INDEX idx_exceptions_product ON inventory_exceptions (product_id);
CREATE INDEX idx_exceptions_classification ON inventory_exceptions (classification);
CREATE INDEX idx_exceptions_severity ON inventory_exceptions (severity);
CREATE INDEX idx_exceptions_state ON inventory_exceptions (state);
CREATE INDEX idx_exceptions_assigned ON inventory_exceptions (assigned_to);
CREATE INDEX idx_exceptions_date ON inventory_exceptions (first_detected_date);
CREATE INDEX idx_exceptions_recurrence ON inventory_exceptions (recurrence_count);

-- Exception investigation notes
CREATE TABLE exception_investigation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL REFERENCES inventory_exceptions(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigation_notes_exception ON exception_investigation_notes (exception_id);

-- Exception status change history
CREATE TABLE exception_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL REFERENCES inventory_exceptions(id) ON DELETE CASCADE,
    old_state investigation_state,
    new_state investigation_state NOT NULL,
    old_severity exception_severity,
    new_severity exception_severity,
    old_classification exception_class,
    new_classification exception_class,
    changed_by UUID NOT NULL REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_exception ON exception_status_history (exception_id);

-- Exception links to source records
CREATE TABLE exception_source_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL REFERENCES inventory_exceptions(id) ON DELETE CASCADE,
    source_table TEXT NOT NULL,
    source_record_id UUID NOT NULL,
    reference_type TEXT NOT NULL, -- 'physical_count', 'movement', 'recorded_loss', 'adjustment'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_source_refs_exception ON exception_source_refs (exception_id);

-- Exception notification/escalation tracking
CREATE TABLE exception_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL REFERENCES inventory_exceptions(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'new_high_priority', 'repeated_shortage', 'critical_integrity', 'review_overdue', 'reopened'
    recipient_id UUID NOT NULL REFERENCES users(id),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id)
);

CREATE INDEX idx_notifications_exception ON exception_notifications (exception_id);
CREATE INDEX idx_notifications_recipient ON exception_notifications (recipient_id);
CREATE INDEX idx_notifications_unread ON exception_notifications (recipient_id, read_at) WHERE read_at IS NULL;

-- Exception escalation rules configuration
CREATE TABLE exception_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Trigger conditions
    min_severity exception_severity NOT NULL DEFAULT 'medium',
    min_recurrence_count INT NOT NULL DEFAULT 3,
    days_since_first_detection INT NOT NULL DEFAULT 7,
    days_unresolved_before_escalation INT NOT NULL DEFAULT 3,
    -- Escalation action
    escalation_recipient_role user_role NOT NULL DEFAULT 'manager',
    custom_recipient_id UUID REFERENCES users(id),
    escalation_message_template TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default escalation rules
INSERT INTO exception_escalation_rules (name, description, min_severity, min_recurrence_count, days_since_first_detection, days_unresolved_before_escalation, escalation_recipient_role) VALUES
    ('Critical data integrity', 'Critical data integrity issues require immediate manager attention', 'critical', 1, 0, 0, 'manager'),
    ('Repeated unexplained shortage', 'Product with repeated unexplained shortages', 'high', 3, 7, 3, 'manager'),
    ('Repeated data integrity issues', 'Repeated data integrity issues', 'medium', 3, 7, 3, 'manager'),
    ('Overdue review', 'Exceptions awaiting review beyond threshold', 'low', 1, 7, 7, 'manager');

-- Trigger for updating updated_at on inventory_exceptions
CREATE OR REPLACE FUNCTION update_exception_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exceptions_updated ON inventory_exceptions;
CREATE TRIGGER trg_exceptions_updated BEFORE UPDATE ON inventory_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_exception_updated_at();

-- Function to log status/severity/classification changes
CREATE OR REPLACE FUNCTION log_exception_changes() RETURNS trigger AS $$
BEGIN
    IF OLD.state IS DISTINCT FROM NEW.state
       OR OLD.severity IS DISTINCT FROM NEW.severity
       OR OLD.classification IS DISTINCT FROM NEW.classification THEN
        INSERT INTO exception_status_history (
            exception_id, old_state, new_state, old_severity, new_severity,
            old_classification, new_classification, changed_by, change_reason
        ) VALUES (
            NEW.id, OLD.state, NEW.state, OLD.severity, NEW.severity,
            OLD.classification, NEW.classification, NEW.updated_by,
            'Status/severity/classification changed via system'
        );
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exception_changes ON inventory_exceptions;
CREATE TRIGGER trg_exception_changes BEFORE UPDATE ON inventory_exceptions
    FOR EACH ROW EXECUTE FUNCTION log_exception_changes();

-- Function to detect and create/update exceptions from a day's reconciliation
CREATE OR REPLACE FUNCTION detect_inventory_exceptions(p_inventory_day_id UUID, p_created_by UUID)
RETURNS TABLE (exception_id UUID, product_id UUID, classification exception_class, severity exception_severity) AS $$
DECLARE
    rec RECORD;
    v_variance_qty NUMERIC(18,4);
    v_classification exception_class;
    v_severity exception_severity;
    v_unit_cost NUMERIC(14,4);
    v_cost_unit TEXT;
    v_estimated_impact NUMERIC(14,4);
    v_recurrence_count INT;
    v_first_detected DATE;
    v_last_detected DATE;
    v_existing_exception UUID;
    v_movements JSONB;
    v_recorded_losses JSONB;
    v_physical_record JSONB;
    v_expected_movements JSONB;
    v_existing_assigned UUID;
    v_existing_state investigation_state;
BEGIN
    -- Get all reconciliation rows for the day with variance
    FOR rec IN 
        SELECT 
            p.id as product_id,
            p.category,
            p.stock_unit as unit,
            p.bottle_size_ml,
            p.package_size_amount,
            p.package_size_unit,
            p.reorder_level,
            COALESCE(SUM(CASE WHEN m.movement_type='opening'      THEN m.amount END),0) AS opening,
            COALESCE(SUM(CASE WHEN m.movement_type='receipt'      THEN m.amount END),0) AS receipts,
            COALESCE(SUM(CASE WHEN m.movement_type='consumption'  THEN m.amount END),0) AS consumption,
            COALESCE(SUM(CASE WHEN m.movement_type='spillage'     THEN m.amount END),0) AS spillage,
            COALESCE(SUM(CASE WHEN m.movement_type='transfer_in'  THEN m.amount END),0) AS transfer_in,
            COALESCE(SUM(CASE WHEN m.movement_type='transfer_out' THEN m.amount END),0) AS transfer_out,
            COALESCE(SUM(CASE WHEN m.movement_type='adjustment'   THEN m.amount END),0) AS adjustments,
            COALESCE(
                COALESCE(SUM(CASE WHEN m.movement_type='opening'      THEN m.amount END),0) +
                COALESCE(SUM(CASE WHEN m.movement_type='receipt'      THEN m.amount END),0) +
                COALESCE(SUM(CASE WHEN m.movement_type='transfer_in'  THEN m.amount END),0) -
                COALESCE(SUM(CASE WHEN m.movement_type='transfer_out' THEN m.amount END),0) -
                COALESCE(SUM(CASE WHEN m.movement_type='consumption'  THEN m.amount END),0) -
                COALESCE(SUM(CASE WHEN m.movement_type='spillage'     THEN m.amount END),0) +
                COALESCE(SUM(CASE WHEN m.movement_type='adjustment'   THEN m.amount END),0)
            ,0) AS expected_closing,
            pc.amount AS physical_count
        FROM products p
        LEFT JOIN stock_movements m ON m.product_id = p.id AND m.inventory_day_id = $1
        LEFT JOIN physical_counts pc ON pc.product_id = p.id AND pc.inventory_day_id = $1
        WHERE p.is_active
        GROUP BY p.id, p.category, p.stock_unit, p.bottle_size_ml, p.package_size_amount, p.package_size_unit, p.reorder_level, pc.amount
    LOOP
        -- Calculate variance if physical count exists
        v_variance_qty := CASE 
            WHEN rec.physical_count IS NOT NULL THEN rec.physical_count - rec.expected_closing
            ELSE NULL
        END;

        -- Determine classification
        IF rec.physical_count IS NULL THEN
            v_classification := 'incomplete_reconciliation';
        ELSIF rec.physical_count - rec.expected_closing < 0 THEN
            -- Shortage detected
            IF rec.spillage > 0 AND rec.spillage >= ABS(rec.physical_count - rec.expected_closing) THEN
                v_classification := 'recorded_loss';
            ELSE
                v_classification := 'unexplained_discrepancy';
            END IF;
        ELSIF rec.physical_count - rec.expected_closing > 0 THEN
            -- Excess detected
            IF rec.receipts > 0 AND rec.receipts >= (rec.physical_count - rec.expected_closing) THEN
                v_classification := 'potential_duplicate_movement';
            ELSE
                v_classification := 'stock_excess';
            END IF;
        ELSE
            v_classification := 'reconciled';
        END IF;

        -- Check for invalid data issues
        IF rec.physical_count IS NOT NULL AND rec.physical_count < 0 THEN
            v_classification := 'invalid_data';
        END IF;

        -- Check for incomplete reconciliation
        IF rec.physical_count IS NULL THEN
            v_classification := 'incomplete_reconciliation';
        END IF;

        -- Determine severity
        v_severity := 'low';
        
        IF v_classification = 'invalid_data' OR v_classification = 'potential_duplicate_movement' THEN
            v_severity := 'high';
        ELSIF v_classification = 'unexplained_discrepancy' OR v_classification = 'stock_excess' THEN
            v_severity := 'medium';
        ELSIF v_classification = 'recorded_loss' THEN
            v_severity := 'low';
        ELSIF v_classification = 'incomplete_reconciliation' THEN
            v_severity := 'medium';
        ELSIF v_classification = 'stock_excess' THEN
            v_severity := 'medium';
        ELSIF v_classification = 'reconciled' THEN
            v_severity := 'informational';
        END IF;

        -- Check for recurrence
        SELECT COUNT(*), MIN(first_detected_date), MAX(last_detected_date)
        INTO v_recurrence_count, v_first_detected, v_last_detected
        FROM inventory_exceptions
        WHERE product_id = rec.product_id
          AND classification = v_classification
          AND state NOT IN ('closed_approved', 'resolved_explained');

        IF v_recurrence_count IS NULL THEN
            v_recurrence_count := 1;
            v_first_detected := CURRENT_DATE;
            v_last_detected := CURRENT_DATE;
        ELSE
            v_recurrence_count := v_recurrence_count + 1;
            v_last_detected := CURRENT_DATE;
        END IF;

        -- Elevate severity for repeated discrepancies
        IF v_recurrence_count >= 3 THEN
            v_severity := CASE 
                WHEN v_severity = 'informational' THEN 'low'
                WHEN v_severity = 'low' THEN 'medium'
                WHEN v_severity = 'medium' THEN 'high'
                ELSE 'critical'
            END;
        END IF;

        -- Check if exception already exists
        SELECT id, assigned_to, state
        INTO v_existing_exception, v_existing_assigned, v_existing_state
        FROM inventory_exceptions
        WHERE inventory_day_id = $1 AND product_id = rec.product_id AND classification = v_classification;

        IF v_existing_exception IS NOT NULL THEN
            -- Update existing exception
            UPDATE inventory_exceptions SET
                severity = v_severity,
                state = CASE 
                    WHEN v_existing_state IN ('closed_approved', 'resolved_explained') THEN v_existing_state
                    ELSE 'open'
                END,
                physical_qty = rec.physical_count,
                variance_qty = rec.physical_count - rec.expected_closing,
                expected_closing_qty = rec.expected_closing,
                opening_qty = rec.opening,
                recurrence_count = v_recurrence_count,
                last_detected_date = v_last_detected,
                updated_at = now(),
                updated_by = p_created_by
            WHERE id = v_existing_exception
            RETURNING id, product_id, classification, severity
            INTO STRICT v_existing_exception, rec.product_id, v_classification, v_severity;
        ELSE
            -- Create new exception
            INSERT INTO inventory_exceptions (
                inventory_day_id, product_id, classification, severity, state,
                opening_qty, expected_closing_qty, physical_qty, variance_qty, unit,
                recurrence_count, first_detected_date, last_detected_date,
                created_by
            ) VALUES (
                $1, rec.product_id, v_classification, v_severity, 'open',
                rec.opening, rec.expected_closing, rec.physical_count, rec.physical_count - rec.expected_closing, rec.unit,
                v_recurrence_count, v_first_detected, v_last_detected,
                p_created_by
            )
            RETURNING id, product_id, classification, severity
            INTO STRICT v_existing_exception, rec.product_id, v_classification, v_severity;
        END IF;

        -- Create source references
        INSERT INTO exception_source_refs (exception_id, source_table, source_record_id, reference_type)
        SELECT v_existing_exception, 'physical_counts', pc.id, 'physical_count'
        FROM physical_counts pc
        WHERE pc.inventory_day_id = $1 AND pc.product_id = rec.product_id;

        INSERT INTO exception_source_refs (exception_id, source_table, source_record_id, reference_type)
        SELECT v_existing_exception, 'stock_movements', m.id, 'movement'
        FROM stock_movements m
        WHERE m.inventory_day_id = $1 AND m.product_id = rec.product_id;

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;