-- Admin Setup - Step 1: Add superadmin to enum
-- Run this first, then run admin-setup-step2.sql

-- Add 'superadmin' to the existing user_role enum if it doesn't already exist
DO $$ 
DECLARE
    enum_exists boolean;
    superadmin_exists boolean;
BEGIN
    -- Check if the enum type exists
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') INTO enum_exists;
    
    IF enum_exists THEN
        -- Check if 'superadmin' value already exists in the enum
        SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superadmin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) INTO superadmin_exists;
        
        IF NOT superadmin_exists THEN
            ALTER TYPE user_role ADD VALUE 'superadmin';
            RAISE NOTICE '✅ Added superadmin value to user_role enum';
            RAISE NOTICE '📋 Now run admin-setup-step2.sql to complete the setup';
        ELSE
            RAISE NOTICE '✅ superadmin value already exists in user_role enum';
            RAISE NOTICE '📋 You can skip to admin-setup-step2.sql';
        END IF;
    ELSE
        -- If the enum doesn't exist, create it with all values
        CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin', 'superadmin');
        RAISE NOTICE '✅ Created user_role enum with all values including superadmin';
        RAISE NOTICE '📋 Now run admin-setup-step2.sql to complete the setup';
    END IF;
END $$;
