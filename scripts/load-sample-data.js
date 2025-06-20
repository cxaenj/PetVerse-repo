#!/usr/bin/env node
// Node.js Sample Data Loader for PetVerse POS System
// This script loads comprehensive sample data into the Supabase database

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data sets
const sampleCustomers = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'sarah.johnson@email.com',
        full_name: 'Sarah Johnson',
        user_type: 'customer',
        phone: '+1-555-0101',
        address: '123 Oak Street, Springfield, IL 62701'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'mike.wilson@email.com',
        full_name: 'Mike Wilson',
        user_type: 'customer',
        phone: '+1-555-0102',
        address: '456 Pine Avenue, Springfield, IL 62702'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'emily.davis@email.com',
        full_name: 'Emily Davis',
        user_type: 'customer',
        phone: '+1-555-0103',
        address: '789 Maple Drive, Springfield, IL 62703'
    },
    {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'david.brown@email.com',
        full_name: 'David Brown',
        user_type: 'customer',
        phone: '+1-555-0104',
        address: '321 Elm Street, Springfield, IL 62704'
    },
    {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'lisa.martinez@email.com',
        full_name: 'Lisa Martinez',
        user_type: 'customer',
        phone: '+1-555-0105',
        address: '654 Cedar Road, Springfield, IL 62705'
    },
    {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'robert.taylor@email.com',
        full_name: 'Robert Taylor',
        user_type: 'customer',
        phone: '+1-555-0106',
        address: '987 Birch Lane, Springfield, IL 62706'
    },
    {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'jennifer.clark@email.com',
        full_name: 'Jennifer Clark',
        user_type: 'customer',
        phone: '+1-555-0107',
        address: '147 Willow Circle, Springfield, IL 62707'
    },
    {
        id: '88888888-8888-8888-8888-888888888888',
        email: 'chris.anderson@email.com',
        full_name: 'Chris Anderson',
        user_type: 'customer',
        phone: '+1-555-0108',
        address: '258 Ash Boulevard, Springfield, IL 62708'
    },
    {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'amanda.thomas@email.com',
        full_name: 'Amanda Thomas',
        user_type: 'customer',
        phone: '+1-555-0109',
        address: '369 Cherry Court, Springfield, IL 62709'
    },
    {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'kevin.white@email.com',
        full_name: 'Kevin White',
        user_type: 'customer',
        phone: '+1-555-0110',
        address: '741 Poplar Street, Springfield, IL 62710'
    }
];

const samplePets = [
    {
        id: 'pet11111-1111-1111-1111-111111111111',
        owner_id: '11111111-1111-1111-1111-111111111111',
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 5,
        gender: 'Male',
        weight: 65.5,
        color: 'Golden',
        microchip_id: 'MC001234567890',
        vaccination_status: 'Up to date',
        emergency_contact: 'Sarah Johnson - +1-555-0101'
    },
    {
        id: 'pet22222-2222-2222-2222-222222222222',
        owner_id: '11111111-1111-1111-1111-111111111111',
        name: 'Whiskers',
        species: 'Cat',
        breed: 'Persian',
        age: 3,
        gender: 'Female',
        weight: 8.2,
        color: 'White',
        microchip_id: 'MC001234567891',
        vaccination_status: 'Up to date',
        emergency_contact: 'Sarah Johnson - +1-555-0101'
    },
    {
        id: 'pet33333-3333-3333-3333-333333333333',
        owner_id: '22222222-2222-2222-2222-222222222222',
        name: 'Rex',
        species: 'Dog',
        breed: 'German Shepherd',
        age: 7,
        gender: 'Male',
        weight: 78.0,
        color: 'Black and Tan',
        microchip_id: 'MC001234567892',
        vaccination_status: 'Up to date',
        emergency_contact: 'Mike Wilson - +1-555-0102'
    },
    {
        id: 'pet44444-4444-4444-4444-444444444444',
        owner_id: '33333333-3333-3333-3333-333333333333',
        name: 'Mittens',
        species: 'Cat',
        breed: 'Maine Coon',
        age: 4,
        gender: 'Female',
        weight: 12.5,
        color: 'Gray and White',
        microchip_id: 'MC001234567893',
        vaccination_status: 'Overdue',
        emergency_contact: 'Emily Davis - +1-555-0103'
    },
    {
        id: 'pet55555-5555-5555-5555-555555555555',
        owner_id: '44444444-4444-4444-4444-444444444444',
        name: 'Charlie',
        species: 'Dog',
        breed: 'Labrador',
        age: 2,
        gender: 'Male',
        weight: 55.0,
        color: 'Chocolate',
        microchip_id: 'MC001234567894',
        vaccination_status: 'Up to date',
        emergency_contact: 'David Brown - +1-555-0104'
    },
    {
        id: 'pet66666-6666-6666-6666-666666666666',
        owner_id: '55555555-5555-5555-5555-555555555555',
        name: 'Bella',
        species: 'Dog',
        breed: 'Border Collie',
        age: 6,
        gender: 'Female',
        weight: 45.0,
        color: 'Black and White',
        microchip_id: 'MC001234567895',
        vaccination_status: 'Up to date',
        emergency_contact: 'Lisa Martinez - +1-555-0105'
    },
    {
        id: 'pet77777-7777-7777-7777-777777777777',
        owner_id: '66666666-6666-6666-6666-666666666666',
        name: 'Smokey',
        species: 'Cat',
        breed: 'Russian Blue',
        age: 5,
        gender: 'Male',
        weight: 10.0,
        color: 'Blue-Gray',
        microchip_id: 'MC001234567896',
        vaccination_status: 'Up to date',
        emergency_contact: 'Robert Taylor - +1-555-0106'
    },
    {
        id: 'pet88888-8888-8888-8888-888888888888',
        owner_id: '77777777-7777-7777-7777-777777777777',
        name: 'Daisy',
        species: 'Dog',
        breed: 'Beagle',
        age: 3,
        gender: 'Female',
        weight: 25.0,
        color: 'Tricolor',
        microchip_id: 'MC001234567897',
        vaccination_status: 'Up to date',
        emergency_contact: 'Jennifer Clark - +1-555-0107'
    },
    {
        id: 'pet99999-9999-9999-9999-999999999999',
        owner_id: '88888888-8888-8888-8888-888888888888',
        name: 'Tweety',
        species: 'Bird',
        breed: 'Canary',
        age: 2,
        gender: 'Male',
        weight: 0.5,
        color: 'Yellow',
        microchip_id: null,
        vaccination_status: 'N/A',
        emergency_contact: 'Chris Anderson - +1-555-0108'
    },
    {
        id: 'petaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        owner_id: '99999999-9999-9999-9999-999999999999',
        name: 'Luna',
        species: 'Cat',
        breed: 'Siamese',
        age: 1,
        gender: 'Female',
        weight: 6.0,
        color: 'Seal Point',
        microchip_id: 'MC001234567898',
        vaccination_status: 'Partial',
        emergency_contact: 'Amanda Thomas - +1-555-0109'
    },
    {
        id: 'petbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Rocky',
        species: 'Dog',
        breed: 'Bulldog',
        age: 4,
        gender: 'Male',
        weight: 50.0,
        color: 'Brindle',
        microchip_id: 'MC001234567899',
        vaccination_status: 'Up to date',
        emergency_contact: 'Kevin White - +1-555-0110'
    },
    {
        id: 'petccccc-cccc-cccc-cccc-cccccccccccc',
        owner_id: '22222222-2222-2222-2222-222222222222',
        name: 'Polly',
        species: 'Bird',
        breed: 'Parrot',
        age: 8,
        gender: 'Female',
        weight: 1.2,
        color: 'Green and Red',
        microchip_id: null,
        vaccination_status: 'N/A',
        emergency_contact: 'Mike Wilson - +1-555-0102'
    },
    {
        id: 'petddddd-dddd-dddd-dddd-dddddddddddd',
        owner_id: '33333333-3333-3333-3333-333333333333',
        name: 'Snowball',
        species: 'Rabbit',
        breed: 'Holland Lop',
        age: 3,
        gender: 'Male',
        weight: 3.5,
        color: 'White',
        microchip_id: null,
        vaccination_status: 'Up to date',
        emergency_contact: 'Emily Davis - +1-555-0103'
    },
    {
        id: 'peteeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        owner_id: '55555555-5555-5555-5555-555555555555',
        name: 'Goldie',
        species: 'Fish',
        breed: 'Goldfish',
        age: 1,
        gender: 'Unknown',
        weight: 0.1,
        color: 'Orange',
        microchip_id: null,
        vaccination_status: 'N/A',
        emergency_contact: 'Lisa Martinez - +1-555-0105'
    },
    {
        id: 'petfffff-ffff-ffff-ffff-ffffffffffff',
        owner_id: '77777777-7777-7777-7777-777777777777',
        name: 'Princess',
        species: 'Cat',
        breed: 'Ragdoll',
        age: 6,
        gender: 'Female',
        weight: 14.0,
        color: 'Cream and Blue',
        microchip_id: 'MC001234567900',
        vaccination_status: 'Up to date',
        emergency_contact: 'Jennifer Clark - +1-555-0107'
    },
    {
        id: 'petggggg-gggg-gggg-gggg-gggggggggggg',
        owner_id: '88888888-8888-8888-8888-888888888888',
        name: 'Thor',
        species: 'Dog',
        breed: 'Rottweiler',
        age: 5,
        gender: 'Male',
        weight: 95.0,
        color: 'Black and Tan',
        microchip_id: 'MC001234567901',
        vaccination_status: 'Up to date',
        emergency_contact: 'Chris Anderson - +1-555-0108'
    }
];

const sampleAppointments = [
    {
        id: 'appt1111-1111-1111-1111-111111111111',
        customer_id: '11111111-1111-1111-1111-111111111111',
        pet_id: 'pet11111-1111-1111-1111-111111111111',
        appointment_date: '2024-12-20',
        appointment_time: '09:00:00',
        service_type: 'Routine Checkup',
        status: 'scheduled',
        notes: 'Annual wellness exam for Buddy',
        veterinarian: 'Dr. Sarah Mitchell'
    },
    {
        id: 'appt2222-2222-2222-2222-222222222222',
        customer_id: '22222222-2222-2222-2222-222222222222',
        pet_id: 'pet33333-3333-3333-3333-333333333333',
        appointment_date: '2024-12-18',
        appointment_time: '14:30:00',
        service_type: 'Vaccination',
        status: 'completed',
        notes: 'Rabies and DHPP vaccinations administered',
        veterinarian: 'Dr. Michael Chen'
    },
    {
        id: 'appt3333-3333-3333-3333-333333333333',
        customer_id: '33333333-3333-3333-3333-333333333333',
        pet_id: 'pet44444-4444-4444-4444-444444444444',
        appointment_date: '2024-12-22',
        appointment_time: '11:15:00',
        service_type: 'Dental Cleaning',
        status: 'scheduled',
        notes: 'Overdue dental cleaning for Mittens',
        veterinarian: 'Dr. Emily Rodriguez'
    },
    {
        id: 'appt4444-4444-4444-4444-444444444444',
        customer_id: '44444444-4444-4444-4444-444444444444',
        pet_id: 'pet55555-5555-5555-5555-555555555555',
        appointment_date: '2024-12-15',
        appointment_time: '16:00:00',
        service_type: 'Surgery',
        status: 'completed',
        notes: 'Neutering procedure completed successfully',
        veterinarian: 'Dr. Robert Johnson'
    },
    {
        id: 'appt5555-5555-5555-5555-555555555555',
        customer_id: '55555555-5555-5555-5555-555555555555',
        pet_id: 'pet66666-6666-6666-6666-666666666666',
        appointment_date: '2024-12-25',
        appointment_time: '10:30:00',
        service_type: 'Emergency',
        status: 'cancelled',
        notes: 'Emergency appointment cancelled - issue resolved at home',
        veterinarian: 'Dr. Lisa Park'
    },
    {
        id: 'appt6666-6666-6666-6666-666666666666',
        customer_id: '66666666-6666-6666-6666-666666666666',
        pet_id: 'pet77777-7777-7777-7777-777777777777',
        appointment_date: '2024-12-21',
        appointment_time: '13:45:00',
        service_type: 'Grooming',
        status: 'scheduled',
        notes: 'Full grooming service for Smokey',
        veterinarian: 'Groomer - Maria Santos'
    },
    {
        id: 'appt7777-7777-7777-7777-777777777777',
        customer_id: '77777777-7777-7777-7777-777777777777',
        pet_id: 'pet88888-8888-8888-8888-888888888888',
        appointment_date: '2024-12-12',
        appointment_time: '08:30:00',
        service_type: 'Routine Checkup',
        status: 'completed',
        notes: 'Health checkup completed - all normal',
        veterinarian: 'Dr. David Kim'
    },
    {
        id: 'appt8888-8888-8888-8888-888888888888',
        customer_id: '88888888-8888-8888-8888-888888888888',
        pet_id: 'pet99999-9999-9999-9999-999999999999',
        appointment_date: '2024-12-23',
        appointment_time: '15:15:00',
        service_type: 'Consultation',
        status: 'scheduled',
        notes: 'Dietary consultation for Tweety',
        veterinarian: 'Dr. Angela Wong'
    },
    {
        id: 'appt9999-9999-9999-9999-999999999999',
        customer_id: '99999999-9999-9999-9999-999999999999',
        pet_id: 'petaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        appointment_date: '2024-12-19',
        appointment_time: '12:00:00',
        service_type: 'Vaccination',
        status: 'completed',
        notes: 'First round of kitten vaccines administered',
        veterinarian: 'Dr. Thomas Lee'
    },
    {
        id: 'apptaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        customer_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        pet_id: 'petbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        appointment_date: '2024-12-24',
        appointment_time: '11:30:00',
        service_type: 'Surgery',
        status: 'scheduled',
        notes: 'Cherry eye correction surgery for Rocky',
        veterinarian: 'Dr. Nicole Garcia'
    }
];

// Helper functions
async function insertData(table, data, label) {
    console.log(`\n📥 Loading ${label}...`);
    
    try {
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, { onConflict: 'id' })
            .select();
        
        if (error) {
            console.error(`❌ Error loading ${label}:`, error.message);
            return false;
        }
        
        console.log(`✅ Successfully loaded ${result.length} ${label}`);
        return true;
    } catch (err) {
        console.error(`❌ Exception loading ${label}:`, err.message);
        return false;
    }
}

async function clearExistingData() {
    console.log('\n🧹 Clearing existing sample data...');
    
    const tables = [
        'appointments',
        'pets',
        'users'
    ];
    
    for (const table of tables) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID
                
            if (error) {
                console.log(`⚠️  Warning clearing ${table}:`, error.message);
            } else {
                console.log(`✅ Cleared ${table}`);
            }
        } catch (err) {
            console.log(`⚠️  Exception clearing ${table}:`, err.message);
        }
    }
}

async function loadAllSampleData() {
    console.log('🚀 Starting PetVerse Sample Data Loading...');
    console.log('=====================================');
    
    // Clear existing data first
    await clearExistingData();
    
    // Load data in correct order (respecting foreign key dependencies)
    const results = [];
    
    results.push(await insertData('users', sampleCustomers, 'Customers'));
    results.push(await insertData('pets', samplePets, 'Pets'));
    results.push(await insertData('appointments', sampleAppointments, 'Appointments'));
    
    // Summary
    const successful = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 LOADING SUMMARY');
    console.log('==================');
    console.log(`✅ Successful: ${successful}/${total}`);
    
    if (successful === total) {
        console.log('🎉 All sample data loaded successfully!');
        console.log('\n📋 Data Summary:');
        console.log(`   • ${sampleCustomers.length} Customers`);
        console.log(`   • ${samplePets.length} Pets`);
        console.log(`   • ${sampleAppointments.length} Appointments`);
    } else {
        console.log('⚠️  Some data loading operations failed. Check the logs above.');
    }
}

// Main execution
if (require.main === module) {
    loadAllSampleData()
        .then(() => {
            console.log('\n✅ Sample data loading completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Sample data loading failed:', error);
            process.exit(1);
        });
}

module.exports = {
    loadAllSampleData,
    sampleCustomers,
    samplePets,
    sampleAppointments,
    sampleHealthRecords,
    samplePetServices,
    sampleServiceBookings
};
