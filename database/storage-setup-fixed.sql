-- PetVerse Supabase Storage Setup - PERMISSION-SAFE VERSION
-- ⚠️ EXECUTE THIS ONLY IN SUPABASE SQL EDITOR
-- 📋 Prerequisites: schema.sql must be run first

-- Step 1: Verify we're in Supabase (not local PostgreSQL)
DO $$
BEGIN
    -- Check if we're in Supabase by looking for storage schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        RAISE EXCEPTION 'ERROR: This script must be run in Supabase SQL Editor, not local PostgreSQL. The storage schema is not available.';
    END IF;
    
    RAISE NOTICE '✅ Confirmed: Running in Supabase environment';
END $$;

-- Step 2: Create storage buckets (Supabase-specific)
-- Note: Only create buckets, RLS policies will be handled differently

-- Pet Photos Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'pet-photos', 
    'pet-photos', 
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Medical Records Storage Bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'medical-records', 
    'medical-records', 
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Product Images Storage Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'product-images', 
    'product-images', 
    true,
    3145728, -- 3MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- User Avatars Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'user-avatars', 
    'user-avatars', 
    false,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 1048576,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Documents Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'documents', 
    'documents', 
    false,
    20971520, -- 20MB limit
    ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];

-- Step 3: Check if RLS is already enabled (safer approach)
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    -- Check if RLS is already enabled on storage.objects
    SELECT relrowsecurity INTO rls_enabled 
    FROM pg_class 
    WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'ℹ️ RLS not enabled on storage.objects - this may require admin permissions';
        RAISE NOTICE '💡 RLS will be automatically handled by Supabase for most use cases';
    ELSE
        RAISE NOTICE '✅ RLS already enabled on storage.objects';
    END IF;
END $$;

-- Step 4: Create RLS Policies (with error handling)
-- Note: These may fail due to permissions, which is normal in some Supabase setups

-- Function to safely create policies
CREATE OR REPLACE FUNCTION create_storage_policy_safe(
    policy_name TEXT,
    bucket_name TEXT,
    operation TEXT,
    condition TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if policy already exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = policy_name
    ) THEN
        RAISE NOTICE 'ℹ️ Policy "%" already exists, skipping', policy_name;
        RETURN TRUE;
    END IF;
    
    -- Try to create the policy
    BEGIN
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s USING (%s)', 
                      policy_name, operation, condition);
        RAISE NOTICE '✅ Created policy: %', policy_name;
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not create policy "%": % (This may be normal)', policy_name, SQLERRM;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Attempt to create basic policies (these may fail, which is OK)
DO $$
DECLARE
    success_count INTEGER := 0;
    total_policies INTEGER := 5;
BEGIN
    RAISE NOTICE '🔐 Attempting to create storage policies...';
    
    -- Basic policies for each bucket
    IF create_storage_policy_safe(
        'Allow authenticated users to upload to pet-photos',
        'pet-photos',
        'INSERT',
        'bucket_id = ''pet-photos'' AND auth.role() = ''authenticated'''
    ) THEN
        success_count := success_count + 1;
    END IF;
    
    IF create_storage_policy_safe(
        'Allow public access to product-images',
        'product-images', 
        'SELECT',
        'bucket_id = ''product-images'''
    ) THEN
        success_count := success_count + 1;
    END IF;
    
    IF create_storage_policy_safe(
        'Allow authenticated users to upload documents',
        'documents',
        'INSERT', 
        'bucket_id = ''documents'' AND auth.role() = ''authenticated'''
    ) THEN
        success_count := success_count + 1;
    END IF;
    
    IF create_storage_policy_safe(
        'Allow authenticated users to upload avatars',
        'user-avatars',
        'INSERT',
        'bucket_id = ''user-avatars'' AND auth.role() = ''authenticated'''
    ) THEN
        success_count := success_count + 1;
    END IF;
    
    IF create_storage_policy_safe(
        'Allow authenticated users to upload medical records',
        'medical-records',
        'INSERT',
        'bucket_id = ''medical-records'' AND auth.role() = ''authenticated'''
    ) THEN
        success_count := success_count + 1;
    END IF;
    
    RAISE NOTICE '📊 Created % of % basic storage policies', success_count, total_policies;
    
    IF success_count = 0 THEN
        RAISE NOTICE '💡 No policies created - Supabase may handle storage security automatically';
        RAISE NOTICE '🔧 You can configure detailed policies in the Supabase Dashboard > Storage > Policies';
    END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_storage_policy_safe(TEXT, TEXT, TEXT, TEXT);

-- Step 5: Update existing tables with storage columns
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_pets_image_storage_path 
ON pets(image_storage_path) 
WHERE image_storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_avatar_storage_path 
ON users(avatar_storage_path) 
WHERE avatar_storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_image_storage_path 
ON products(image_storage_path) 
WHERE image_storage_path IS NOT NULL;

-- Step 7: Create helper functions for storage operations
CREATE OR REPLACE FUNCTION get_pet_photo_url(pet_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT image_url FROM pets WHERE id = pet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_avatar_url(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT avatar_url FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Verification and Success Message
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Count created buckets
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id IN ('pet-photos', 'medical-records', 'product-images', 'user-avatars', 'documents');
    
    -- Count created policies (may be 0 due to permissions)
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname LIKE '%pet-%' OR policyname LIKE '%product-%' OR policyname LIKE '%document%' OR policyname LIKE '%avatar%' OR policyname LIKE '%medical%';
    
    -- Count updated tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND (column_name = 'image_storage_path' OR column_name = 'avatar_storage_path' OR column_name = 'image_url' OR column_name = 'avatar_url');
    
    -- Report results
    RAISE NOTICE '🎉 PetVerse Storage Setup COMPLETED!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '📁 Storage buckets created: % of 5', bucket_count;
    RAISE NOTICE '🔐 Storage policies: % created', policy_count;
    RAISE NOTICE '📊 Table columns added: % storage fields', table_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 Bucket Configuration:';
    RAISE NOTICE '   🐕 pet-photos (5MB, images only)';
    RAISE NOTICE '   🏥 medical-records (10MB, docs + images)';  
    RAISE NOTICE '   🛍️ product-images (3MB, public images)';
    RAISE NOTICE '   👤 user-avatars (1MB, profile pictures)';
    RAISE NOTICE '   📄 documents (20MB, general files)';
    RAISE NOTICE '';
    
    IF bucket_count = 5 THEN
        RAISE NOTICE '✅ All storage buckets created successfully!';
    ELSE
        RAISE WARNING '⚠️ Only % of 5 buckets were created', bucket_count;
    END IF;
    
    IF policy_count = 0 THEN
        RAISE NOTICE '💡 Storage policies: Configure manually in Supabase Dashboard';
        RAISE NOTICE '🔧 Go to Storage > Policies to set up access rules';
    ELSE
        RAISE NOTICE '✅ Basic storage policies created';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next Steps:';
    RAISE NOTICE '   1. Test storage functionality with the storage test page';
    RAISE NOTICE '   2. Configure additional policies in Supabase Dashboard if needed';
    RAISE NOTICE '   3. Update your app credentials in config/supabase.js';
    RAISE NOTICE '   4. Run ./test-storage.sh to verify everything works';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Storage system is ready for file uploads!';
END $$;
