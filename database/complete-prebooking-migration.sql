-- =============================================================================
-- COMPLETE PREBOOKING MIGRATION - ADD MISSING COLUMNS
-- =============================================================================
-- This adds the remaining columns that weren't added in the previous migration
-- =============================================================================

-- Add advance payment requirement
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS advance_payment_required BOOLEAN DEFAULT false;

-- Add advance payment percentage (0-100)
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS advance_payment_percentage INTEGER DEFAULT 0 
CHECK (advance_payment_percentage BETWEEN 0 AND 100);

-- Add seller confidence level for prebooking items
-- Default 100% for existing products (they're already available, so high confidence)
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS seller_confidence INTEGER DEFAULT 100 
CHECK (seller_confidence BETWEEN 1 AND 100);

-- Add notes for prebooking products
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS prebooking_notes TEXT;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_vegetables_advance_payment ON vegetables(advance_payment_required);
CREATE INDEX IF NOT EXISTS idx_vegetables_seller_confidence ON vegetables(seller_confidence);

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vegetables' 
AND column_name IN (
    'advance_payment_required', 
    'advance_payment_percentage', 
    'seller_confidence', 
    'prebooking_notes'
)
ORDER BY column_name;

-- =============================================================================
-- END OF COMPLETION MIGRATION
-- =============================================================================
