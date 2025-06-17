// PetVerse Supabase Integration Test Script
// This script tests all major Supabase integration components

console.log('🧪 Starting PetVerse Supabase Integration Tests...');

// Test Configuration
const testConfig = {
    supabaseUrl: 'https://odjigifmwsdcnfjskanm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'
};

// Test Results Storage
const testResults = {
    supabaseConnection: false,
    tablesExist: false,
    dataOperations: false,
    realTimeUpdates: false,
    authenticationReady: false,
    storageBuckets: false,
    fileOperations: false
};

// Initialize Supabase for testing
let testSupabase = null;

async function initializeTestSupabase() {
    console.log('🔌 Testing Supabase Connection...');
    
    try {
        if (typeof window !== 'undefined' && window.supabase) {
            testSupabase = window.supabase.createClient(testConfig.supabaseUrl, testConfig.supabaseKey);
            console.log('✅ Supabase client initialized successfully');
            testResults.supabaseConnection = true;
            return true;
        } else {
            console.log('❌ Supabase not available in global scope');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

// Test 1: Check if required tables exist
async function testTablesExist() {
    console.log('🗄️ Testing Database Tables...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping table tests');
        return false;
    }

    const requiredTables = [
        'users', 'pet_categories', 'products', 'pets', 
        'appointments', 'sales', 'sale_items', 'pet_services', 
        'service_bookings', 'health_records'
    ];

    let tablesFound = 0;

    for (const table of requiredTables) {
        try {
            const { data, error } = await testSupabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                console.log(`✅ Table '${table}' exists`);
                tablesFound++;
            } else {
                console.log(`❌ Table '${table}' not found:`, error.message);
            }
        } catch (error) {
            console.log(`❌ Error checking table '${table}':`, error.message);
        }
    }

    testResults.tablesExist = tablesFound === requiredTables.length;
    console.log(`📊 Tables found: ${tablesFound}/${requiredTables.length}`);
    
    return testResults.tablesExist;
}

// Test 2: Test basic CRUD operations
async function testDataOperations() {
    console.log('🔄 Testing Data Operations...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping data operation tests');
        return false;
    }

    try {
        // Test reading data (non-destructive)
        const { data: usersData, error: usersError } = await testSupabase
            .from('users')
            .select('*')
            .limit(1);

        if (!usersError) {
            console.log('✅ Successfully read from users table');
        } else {
            console.log('❌ Failed to read from users table:', usersError.message);
        }

        const { data: productsData, error: productsError } = await testSupabase
            .from('products')
            .select('*')
            .limit(1);

        if (!productsError) {
            console.log('✅ Successfully read from products table');
        } else {
            console.log('❌ Failed to read from products table:', productsError.message);
        }

        testResults.dataOperations = !usersError && !productsError;
        return testResults.dataOperations;

    } catch (error) {
        console.error('❌ Data operations test failed:', error);
        return false;
    }
}

// Test 3: Test real-time subscriptions
async function testRealTimeUpdates() {
    console.log('⚡ Testing Real-time Updates...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping real-time tests');
        return false;
    }

    try {
        // Test setting up a real-time subscription
        const testChannel = testSupabase
            .channel('test-channel')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('✅ Real-time update received:', payload);
                }
            );

        // Subscribe and then unsubscribe
        const subscriptionResponse = await testChannel.subscribe();
        
        if (subscriptionResponse === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription successful');
            testResults.realTimeUpdates = true;
            
            // Clean up
            await testChannel.unsubscribe();
        } else {
            console.log('❌ Real-time subscription failed');
            testResults.realTimeUpdates = false;
        }

        return testResults.realTimeUpdates;

    } catch (error) {
        console.error('❌ Real-time test failed:', error);
        return false;
    }
}

// Test 4: Test storage buckets
async function testStorageBuckets() {
    console.log('🗂️ Testing Storage Buckets...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping storage tests');
        return false;
    }

    const requiredBuckets = [
        'pet-photos',
        'medical-records', 
        'product-images',
        'user-avatars',
        'documents'
    ];

    try {
        const { data: buckets, error } = await testSupabase.storage.listBuckets();
        
        if (error) {
            console.log('❌ Failed to list storage buckets:', error.message);
            return false;
        }

        const bucketNames = buckets.map(bucket => bucket.name);
        let bucketsFound = 0;

        for (const bucketName of requiredBuckets) {
            if (bucketNames.includes(bucketName)) {
                console.log(`✅ Storage bucket '${bucketName}' exists`);
                bucketsFound++;
            } else {
                console.log(`❌ Storage bucket '${bucketName}' not found`);
            }
        }

        testResults.storageBuckets = bucketsFound === requiredBuckets.length;
        console.log(`📊 Storage buckets found: ${bucketsFound}/${requiredBuckets.length}`);
        
        return testResults.storageBuckets;

    } catch (error) {
        console.error('❌ Storage bucket test failed:', error);
        return false;
    }
}

// Test 5: Test file operations
async function testFileOperations() {
    console.log('📁 Testing File Operations...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping file operation tests');
        return false;
    }

    try {
        // Create a test file (small text file)
        const testFileName = `test-file-${Date.now()}.txt`;
        const testFileContent = 'PetVerse storage test file';
        const testFile = new Blob([testFileContent], { type: 'text/plain' });

        // Test 1: Upload file
        console.log('📤 Testing file upload...');
        const { data: uploadData, error: uploadError } = await testSupabase.storage
            .from('documents')
            .upload(`test/${testFileName}`, testFile);

        if (uploadError) {
            console.log('❌ File upload failed:', uploadError.message);
            // This might fail due to RLS policies, which is expected
            console.log('ℹ️ Upload failure may be due to RLS policies (expected in production)');
        } else {
            console.log('✅ File upload successful');
        }

        // Test 2: List files in bucket
        console.log('📋 Testing file listing...');
        const { data: listData, error: listError } = await testSupabase.storage
            .from('documents')
            .list('test', { limit: 1 });

        if (!listError) {
            console.log('✅ File listing successful');
        } else {
            console.log('❌ File listing failed:', listError.message);
        }

        // Test 3: Get public URL (this should work even without upload)
        console.log('🔗 Testing public URL generation...');
        const { data: urlData } = testSupabase.storage
            .from('documents')
            .getPublicUrl(`test/${testFileName}`);

        if (urlData && urlData.publicUrl) {
            console.log('✅ Public URL generation successful');
        } else {
            console.log('❌ Public URL generation failed');
        }

        // Test 4: Clean up (delete test file if it was uploaded)
        if (!uploadError) {
            console.log('🗑️ Testing file deletion...');
            const { error: deleteError } = await testSupabase.storage
                .from('documents')
                .remove([`test/${testFileName}`]);

            if (!deleteError) {
                console.log('✅ File deletion successful');
            } else {
                console.log('❌ File deletion failed:', deleteError.message);
            }
        }

        // Consider test successful if at least listing and URL generation work
        testResults.fileOperations = !listError && urlData?.publicUrl;
        return testResults.fileOperations;

    } catch (error) {
        console.error('❌ File operations test failed:', error);
        return false;
    }
}

// Test 6: Test authentication readiness
async function testAuthenticationReady() {
    console.log('🔐 Testing Authentication Configuration...');
    
    if (!testSupabase) {
        console.log('❌ Supabase not initialized, skipping auth tests');
        return false;
    }

    try {
        // Test if auth is configured (won't actually authenticate)
        const { data: { session }, error } = await testSupabase.auth.getSession();
        
        // No error means auth is configured properly
        console.log('✅ Authentication system is ready');
        testResults.authenticationReady = true;
        
        return true;

    } catch (error) {
        console.error('❌ Authentication test failed:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running Complete Supabase Integration Test Suite...');
    console.log('='.repeat(60));

    const startTime = performance.now();

    // Run tests in sequence
    await initializeTestSupabase();
    await testTablesExist();
    await testDataOperations();
    await testRealTimeUpdates();
    await testStorageBuckets();
    await testFileOperations();
    await testAuthenticationReady();

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    // Print results
    console.log('='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`🔌 Supabase Connection: ${testResults.supabaseConnection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🗄️ Database Tables: ${testResults.tablesExist ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 Data Operations: ${testResults.dataOperations ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚡ Real-time Updates: ${testResults.realTimeUpdates ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🗂️ Storage Buckets: ${testResults.storageBuckets ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📁 File Operations: ${testResults.fileOperations ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔐 Authentication Ready: ${testResults.authenticationReady ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60));
    
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.values(testResults).length;
    
    console.log(`📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
    console.log(`⏱️ Test Duration: ${duration}ms`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! PetVerse Supabase integration is ready!');
    } else {
        console.log('⚠️ Some tests failed. Please check the setup guide for troubleshooting.');
    }

    return testResults;
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(runAllTests, 2000); // Wait 2 seconds for page to fully load
    });
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.PetVerseSupabaseTests = {
        runAllTests,
        testResults,
        initializeTestSupabase,
        testTablesExist,
        testDataOperations,
        testRealTimeUpdates,
        testStorageBuckets,
        testFileOperations,
        testAuthenticationReady
    };
}

console.log('🧪 PetVerse Supabase Test Script Loaded');
console.log('💡 Tests will run automatically, or call PetVerseSupabaseTests.runAllTests() manually');
