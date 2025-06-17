// Import Supabase configuration
// Note: In a browser environment, we'll use the global supabase object from the CDN

// Mock data for fallback
const mockData = {
    totalSales: 15420,
    totalCustomers: 328,
    totalProducts: 156,
    totalPets: 89,
    recentSales: [
        { id: 1, customerName: "John Doe", amount: 45.99, date: "2024-12-01", items: ["Dog Food", "Collar"] },
        { id: 2, customerName: "Jane Smith", amount: 78.50, date: "2024-12-01", items: ["Cat Litter", "Toys"] },
        { id: 3, customerName: "Mike Johnson", amount: 125.00, date: "2024-12-01", items: ["Pet Carrier", "Leash"] },
        { id: 4, customerName: "Sarah Wilson", amount: 32.75, date: "2024-11-30", items: ["Bird Seed"] },
        { id: 5, customerName: "Tom Brown", amount: 89.99, date: "2024-11-30", items: ["Aquarium Filter"] }
    ],
    lowStockProducts: [
        { id: 1, name: "Premium Dog Food", stock: 5, minStock: 10 },
        { id: 2, name: "Cat Treats", stock: 3, minStock: 15 },
        { id: 3, name: "Bird Seed Mix", stock: 2, minStock: 8 },
        { id: 4, name: "Fish Tank Cleaner", stock: 1, minStock: 5 }
    ],
    recentAppointments: [
        { id: 1, petName: "Buddy", ownerName: "John Doe", date: "2024-12-02", time: "10:00 AM", type: "Checkup" },
        { id: 2, petName: "Whiskers", ownerName: "Jane Smith", date: "2024-12-02", time: "2:30 PM", type: "Vaccination" },
        { id: 3, petName: "Charlie", ownerName: "Mike Johnson", date: "2024-12-03", time: "11:15 AM", type: "Grooming" },
        { id: 4, petName: "Luna", ownerName: "Sarah Wilson", date: "2024-12-03", time: "3:45 PM", type: "Emergency" }
    ]
};

// Supabase configuration - will be initialized when window loads
let supabaseClient = null;

// Initialize Supabase client
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA';
        
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        
        console.log('Supabase client initialized successfully');
        return true;
    }
    
    console.warn('Supabase not available, falling back to mock data');
    return false;
}

// Database helper functions
const db = {
    // Test connection
    async testConnection() {
        if (!supabaseClient) return false;
        
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('count(*)', { count: 'exact', head: true });
            
            return !error;
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    },

    // Dashboard statistics
    async getDashboardStats() {
        if (!supabaseClient) return null;
        
        try {
            // Get total sales amount
            const { data: salesData } = await supabaseClient
                .from('sales')
                .select('total_amount');
            
            const totalSales = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;

            // Get total customers
            const { count: totalCustomers } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('user_type', 'customer');

            // Get total products
            const { count: totalProducts } = await supabaseClient
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Get total pets
            const { count: totalPets } = await supabaseClient
                .from('pets')
                .select('*', { count: 'exact', head: true });

            return {
                totalSales: Math.round(totalSales),
                totalCustomers: totalCustomers || 0,
                totalProducts: totalProducts || 0,
                totalPets: totalPets || 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        }
    },

    // Recent sales
    async getRecentSales(limit = 5) {
        if (!supabaseClient) return null;
        
        try {
            const { data, error } = await supabaseClient
                .from('sales')
                .select(`
                    id,
                    total_amount,
                    sale_date,
                    users!sales_customer_id_fkey(full_name),
                    sale_items(
                        quantity,
                        products(name)
                    )
                `)
                .order('sale_date', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data?.map(sale => ({
                id: sale.id,
                customerName: sale.users?.full_name || 'Unknown Customer',
                amount: parseFloat(sale.total_amount),
                date: sale.sale_date,
                items: sale.sale_items?.map(item => item.products?.name).filter(Boolean) || []
            })) || [];
        } catch (error) {
            console.error('Error fetching recent sales:', error);
            return null;
        }
    },

    // Low stock products
    async getLowStockProducts(threshold = 10) {
        if (!supabaseClient) return null;
        
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, stock_quantity')
                .lte('stock_quantity', threshold)
                .eq('is_active', true)
                .order('stock_quantity', { ascending: true });

            if (error) throw error;

            return data?.map(product => ({
                id: product.id,
                name: product.name,
                stock: product.stock_quantity,
                minStock: threshold
            })) || [];
        } catch (error) {
            console.error('Error fetching low stock products:', error);
            return null;
        }
    },

    // Recent appointments
    async getRecentAppointments(limit = 5) {
        if (!supabaseClient) return null;
        
        try {
            const { data, error } = await supabaseClient
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    appointment_type,
                    pets(name),
                    users!appointments_owner_id_fkey(full_name)
                `)
                .gte('appointment_date', new Date().toISOString())
                .order('appointment_date', { ascending: true })
                .limit(limit);

            if (error) throw error;

            return data?.map(appointment => ({
                id: appointment.id,
                petName: appointment.pets?.name || 'Unknown Pet',
                ownerName: appointment.users?.full_name || 'Unknown Owner',
                date: new Date(appointment.appointment_date).toISOString().split('T')[0],
                time: new Date(appointment.appointment_date).toLocaleTimeString(),
                type: appointment.appointment_type
            })) || [];
        } catch (error) {
            console.error('Error fetching recent appointments:', error);
            return null;
        }
    }
};

// Dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Show loading state
        showLoadingState();
        
        // Initialize Supabase
        const supabaseAvailable = initializeSupabase();
        
        if (supabaseAvailable) {
            // Test database connection
            const connectionOk = await db.testConnection();
            
            if (connectionOk) {
                showNotification('Connected to Supabase database!', 'success');
                // Load real data from Supabase
                await loadDashboardDataFromSupabase();
            } else {
                showNotification('Database connection failed, using offline mode', 'warning');
                // Fallback to mock data
                await loadDashboardDataFromMock();
            }
        } else {
            showNotification('Supabase not available, using offline mode', 'warning');
            // Fallback to mock data
            await loadDashboardDataFromMock();
        }
        
        // Initialize charts
        initializeCharts();
        
        // Set up real-time updates if Supabase is available
        if (supabaseAvailable && supabaseClient) {
            setupRealTimeUpdates();
        }
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
        hideLoadingState();
        
        // Fallback to mock data on error
        await loadDashboardDataFromMock();
    }
}

async function loadDashboardDataFromSupabase() {
    try {
        // Load dashboard statistics
        const stats = await db.getDashboardStats();
        if (stats) {
            updateDashboardStats(stats);
        } else {
            throw new Error('Failed to load stats');
        }
        
        // Load recent activities
        await Promise.all([
            loadRecentSalesFromSupabase(),
            loadLowStockAlertsFromSupabase(),
            loadRecentAppointmentsFromSupabase()
        ]);
        
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fallback to mock data
        await loadDashboardDataFromMock();
    }
}

async function loadDashboardDataFromMock() {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update dashboard statistics with mock data
        updateDashboardStats({
            totalSales: mockData.totalSales,
            totalCustomers: mockData.totalCustomers,
            totalProducts: mockData.totalProducts,
            totalPets: mockData.totalPets
        });
        
        // Load recent activities with mock data
        await loadRecentSales();
        await loadLowStockAlerts();
        await loadRecentAppointments();
        
    } catch (error) {
        console.error('Error loading mock data:', error);
        throw error;
    }
}

function showLoadingState() {
    // Add loading spinners to dashboard cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.style.opacity = '0.6';
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div>';
        card.appendChild(loader);
    });
}

function hideLoadingState() {
    // Remove loading spinners
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.style.opacity = '1';
        const loader = card.querySelector('.loading-spinner');
        if (loader) loader.remove();
    });
}

function updateDashboardStats(stats) {
    // Update total sales
    const salesElement = document.getElementById('totalSales');
    if (salesElement) {
        animateCounter(salesElement, 0, stats.totalSales, 1000, true);
    }
    
    // Update total customers
    const customersElement = document.getElementById('totalCustomers');
    if (customersElement) {
        animateCounter(customersElement, 0, stats.totalCustomers, 1000);
    }
    
    // Update total products
    const productsElement = document.getElementById('totalProducts');
    if (productsElement) {
        animateCounter(productsElement, 0, stats.totalProducts, 1000);
    }
    
    // Update total pets
    const petsElement = document.getElementById('totalPets');
    if (petsElement) {
        animateCounter(petsElement, 0, stats.totalPets, 1000);
    }
}

function animateCounter(element, start, end, duration, isCurrency = false) {
    const range = end - start;
    const minTimer = 50;
    const stepTime = Math.abs(Math.floor(duration / range));
    
    const timer = setInterval(() => {
        start += 1;
        const value = isCurrency ? `$${start.toLocaleString()}` : start.toLocaleString();
        element.textContent = value;
        
        if (start >= end) {
            clearInterval(timer);
        }
    }, Math.max(stepTime, minTimer));
}

async function loadRecentSalesFromSupabase() {
    const salesContainer = document.getElementById('recentSalesContainer');
    if (!salesContainer) return;
    
    // Clear existing content
    salesContainer.innerHTML = '<div class="loading">Loading recent sales...</div>';
    
    try {
        const salesData = await db.getRecentSales();
        
        if (salesData && salesData.length > 0) {
            const salesHTML = salesData.map(sale => `
                <div class="sale-item" data-sale-id="${sale.id}">
                    <div class="sale-info">
                        <div class="customer-name">${sale.customerName}</div>
                        <div class="sale-details">
                            <span class="amount">$${sale.amount.toFixed(2)}</span>
                            <span class="date">${formatDate(sale.date)}</span>
                        </div>
                        <div class="items">${sale.items.join(', ') || 'No items'}</div>
                    </div>
                    <div class="sale-actions">
                        <button class="btn btn-sm" onclick="viewSaleDetails('${sale.id}')">
                            <i class="icon-eye"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            salesContainer.innerHTML = salesHTML;
        } else {
            salesContainer.innerHTML = '<div class="no-data">No recent sales found</div>';
        }
        
        // Add animation
        const items = salesContainer.querySelectorAll('.sale-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
    } catch (error) {
        console.error('Error loading recent sales from Supabase:', error);
        // Fallback to mock data
        await loadRecentSales();
    }
}

async function loadRecentSales() {
    const salesContainer = document.getElementById('recentSalesContainer');
    if (!salesContainer) return;
    
    // Clear existing content
    salesContainer.innerHTML = '<div class="loading">Loading recent sales...</div>';
    
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const salesHTML = mockData.recentSales.map(sale => `
            <div class="sale-item" data-sale-id="${sale.id}">
                <div class="sale-info">
                    <div class="customer-name">${sale.customerName}</div>
                    <div class="sale-details">
                        <span class="amount">$${sale.amount}</span>
                        <span class="date">${formatDate(sale.date)}</span>
                    </div>
                    <div class="items">${sale.items.join(', ')}</div>
                </div>
                <div class="sale-actions">
                    <button class="btn btn-sm" onclick="viewSaleDetails(${sale.id})">
                        <i class="icon-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        salesContainer.innerHTML = salesHTML;
        
        // Add animation
        const items = salesContainer.querySelectorAll('.sale-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
    } catch (error) {
        console.error('Error loading recent sales:', error);
        salesContainer.innerHTML = '<div class="error">Failed to load recent sales</div>';
    }
}

async function loadLowStockAlertsFromSupabase() {
    const alertsContainer = document.getElementById('lowStockAlertsContainer');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '<div class="loading">Loading stock alerts...</div>';
    
    try {
        const stockData = await db.getLowStockProducts();
        
        if (stockData && stockData.length > 0) {
            const alertsHTML = stockData.map(product => `
                <div class="alert-item ${product.stock <= 2 ? 'critical' : 'warning'}">
                    <div class="alert-info">
                        <div class="product-name">${product.name}</div>
                        <div class="stock-info">
                            <span class="current-stock">Stock: ${product.stock}</span>
                            <span class="min-stock">Min: ${product.minStock}</span>
                        </div>
                    </div>
                    <div class="alert-actions">
                        <button class="btn btn-sm btn-primary" onclick="reorderProduct('${product.id}')">
                            Reorder
                        </button>
                    </div>
                </div>
            `).join('');
            
            alertsContainer.innerHTML = alertsHTML;
        } else {
            alertsContainer.innerHTML = '<div class="no-data">All products are well stocked!</div>';
        }
        
    } catch (error) {
        console.error('Error loading stock alerts from Supabase:', error);
        // Fallback to mock data
        await loadLowStockAlerts();
    }
}

async function loadLowStockAlerts() {
    const alertsContainer = document.getElementById('lowStockAlertsContainer');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '<div class="loading">Loading stock alerts...</div>';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const alertsHTML = mockData.lowStockProducts.map(product => `
            <div class="alert-item ${product.stock <= 2 ? 'critical' : 'warning'}">
                <div class="alert-info">
                    <div class="product-name">${product.name}</div>
                    <div class="stock-info">
                        <span class="current-stock">Stock: ${product.stock}</span>
                        <span class="min-stock">Min: ${product.minStock}</span>
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="reorderProduct(${product.id})">
                        Reorder
                    </button>
                </div>
            </div>
        `).join('');
        
        alertsContainer.innerHTML = alertsHTML;
        
    } catch (error) {
        console.error('Error loading stock alerts:', error);
        alertsContainer.innerHTML = '<div class="error">Failed to load stock alerts</div>';
    }
}

async function loadRecentAppointmentsFromSupabase() {
    const appointmentsContainer = document.getElementById('recentAppointmentsContainer');
    if (!appointmentsContainer) return;
    
    appointmentsContainer.innerHTML = '<div class="loading">Loading appointments...</div>';
    
    try {
        const appointmentsData = await db.getRecentAppointments();
        
        if (appointmentsData && appointmentsData.length > 0) {
            const appointmentsHTML = appointmentsData.map(appointment => `
                <div class="appointment-item">
                    <div class="appointment-info">
                        <div class="pet-info">
                            <span class="pet-name">${appointment.petName}</span>
                            <span class="owner-name">(${appointment.ownerName})</span>
                        </div>
                        <div class="appointment-details">
                            <span class="date">${formatDate(appointment.date)}</span>
                            <span class="time">${appointment.time}</span>
                            <span class="type">${appointment.type}</span>
                        </div>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn btn-sm" onclick="viewAppointment('${appointment.id}')">
                            <i class="icon-calendar"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            appointmentsContainer.innerHTML = appointmentsHTML;
        } else {
            appointmentsContainer.innerHTML = '<div class="no-data">No upcoming appointments</div>';
        }
        
    } catch (error) {
        console.error('Error loading appointments from Supabase:', error);
        // Fallback to mock data
        await loadRecentAppointments();
    }
}

async function loadRecentAppointments() {
    const appointmentsContainer = document.getElementById('recentAppointmentsContainer');
    if (!appointmentsContainer) return;
    
    appointmentsContainer.innerHTML = '<div class="loading">Loading appointments...</div>';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const appointmentsHTML = mockData.recentAppointments.map(appointment => `
            <div class="appointment-item">
                <div class="appointment-info">
                    <div class="pet-info">
                        <span class="pet-name">${appointment.petName}</span>
                        <span class="owner-name">(${appointment.ownerName})</span>
                    </div>
                    <div class="appointment-details">
                        <span class="date">${formatDate(appointment.date)}</span>
                        <span class="time">${appointment.time}</span>
                        <span class="type">${appointment.type}</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm" onclick="viewAppointment(${appointment.id})">
                        <i class="icon-calendar"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        appointmentsContainer.innerHTML = appointmentsHTML;
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        appointmentsContainer.innerHTML = '<div class="error">Failed to load appointments</div>';
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Real-time updates setup
function setupRealTimeUpdates() {
    if (!supabaseClient) return;
    
    // Subscribe to real-time changes
    const salesChannel = supabaseClient
        .channel('sales-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sales' },
            () => {
                console.log('Sales data changed, refreshing...');
                loadRecentSalesFromSupabase();
            }
        )
        .subscribe();

    const appointmentsChannel = supabaseClient
        .channel('appointments-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            () => {
                console.log('Appointments data changed, refreshing...');
                loadRecentAppointmentsFromSupabase();
            }
        )
        .subscribe();

    const productsChannel = supabaseClient
        .channel('products-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            () => {
                console.log('Products data changed, refreshing...');
                loadLowStockAlertsFromSupabase();
            }
        )
        .subscribe();
}

// Charts initialization
function initializeCharts() {
    // Initialize any charts here
    console.log('Charts initialized');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Action handlers
function viewSaleDetails(saleId) {
    console.log('Viewing sale details for:', saleId);
    showNotification(`Opening sale details for ID: ${saleId}`, 'info');
}

function viewAppointment(appointmentId) {
    console.log('Viewing appointment details for:', appointmentId);
    showNotification(`Opening appointment details for ID: ${appointmentId}`, 'info');
}

function reorderProduct(productId) {
    console.log('Reordering product:', productId);
    showNotification(`Reorder initiated for product ID: ${productId}`, 'success');
}

// Session management
function checkAdminSession() {
    const session = JSON.parse(sessionStorage.getItem('session') || '{}');
    if (!session.userType || session.userType !== 'admin') {
        console.warn('No valid admin session found');
        return false;
    }
    return true;
}

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
            console.log(`Page load time: ${entry.loadEventEnd - entry.loadEventStart}ms`);
        }
    }
});

if (typeof PerformanceObserver !== 'undefined') {
    performanceObserver.observe({ entryTypes: ['navigation'] });
}
