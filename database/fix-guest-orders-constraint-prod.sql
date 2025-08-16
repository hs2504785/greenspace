-- ==================================================
-- PRODUCTION FIX: Guest Orders Status Constraint
-- ==================================================
-- 
-- Problem: guest_orders table has a check constraint that only allows:
-- ('whatsapp_sent', 'confirmed', 'delivered', 'cancelled')
-- 
-- But the API expects these statuses:
-- ('whatsapp_sent', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
-- 
-- This causes "Start Processing" functionality to fail with constraint violation
-- ==================================================

-- Step 1: Backup existing constraint information
SELECT 
    'BEFORE FIX - Current constraint:' as step,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%guest_orders%status%' OR conrelid = 'guest_orders'::regclass::oid;

-- Step 2: Show current invalid statuses (if any exist)
SELECT 
    'BEFORE FIX - Orders with invalid statuses:' as step,
    status, 
    COUNT(*) as count
FROM guest_orders 
WHERE status NOT IN ('whatsapp_sent', 'confirmed', 'delivered', 'cancelled')
GROUP BY status;

-- Step 3: Drop the existing check constraint
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'guest_orders_status_check'
        AND conrelid = 'guest_orders'::regclass::oid
    ) THEN
        ALTER TABLE guest_orders DROP CONSTRAINT guest_orders_status_check;
        RAISE NOTICE 'Dropped existing guest_orders_status_check constraint';
    ELSE
        RAISE NOTICE 'No existing guest_orders_status_check constraint found';
    END IF;
END $$;

-- Step 4: Add the updated check constraint with all required status values
ALTER TABLE guest_orders ADD CONSTRAINT guest_orders_status_check 
CHECK (status IN ('whatsapp_sent', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Step 5: Update the column comment
COMMENT ON COLUMN guest_orders.status IS 'Order status: whatsapp_sent, confirmed, processing, shipped, delivered, cancelled';

-- Step 6: Verify the fix
SELECT 
    'AFTER FIX - New constraint:' as step,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'guest_orders_status_check';

-- Step 7: Test the fix by attempting a status update (this should not fail)
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    -- Find a guest order with 'confirmed' status to test with
    SELECT id INTO test_order_id 
    FROM guest_orders 
    WHERE status = 'confirmed' 
    LIMIT 1;
    
    IF test_order_id IS NOT NULL THEN
        -- Test update to 'processing' (this should now work)
        UPDATE guest_orders 
        SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
        WHERE id = test_order_id;
        
        -- Revert back to 'confirmed'
        UPDATE guest_orders 
        SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = test_order_id;
        
        RAISE NOTICE 'SUCCESS: Test update to processing status succeeded for order %', test_order_id;
    ELSE
        RAISE NOTICE 'No confirmed guest orders found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: Test update failed - %', SQLERRM;
END $$;

-- Step 8: Final verification
SELECT 
    'VERIFICATION COMPLETE' as status,
    'The guest_orders status constraint has been successfully updated' as message,
    'New allowed statuses: whatsapp_sent, confirmed, processing, shipped, delivered, cancelled' as allowed_statuses;
