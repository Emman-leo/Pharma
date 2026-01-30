// Initialize Supabase client
const supabaseUrl = 'https://idjbruyuhyyyoucivksj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkamJydXl1aHl5eW91Y2l2a3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc1MDksImV4cCI6MjA4NDYwMzUwOX0.uSxJidEC-S-z0ZMCMb2Bv14Q1EedgqKk4hTMx_EqHmU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const exportReportBtn = document.getElementById('exportReportBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const currentPharmacyDisplay = document.getElementById('currentPharmacyDisplay');
const dashboardTitle = document.getElementById('dashboardTitle');
const inventorySection = document.getElementById('inventorySection');
const salesSection = document.getElementById('salesSection');
const reportsSection = document.getElementById('reportsSection');
const inventoryBtn = document.getElementById('inventoryBtn');
const salesBtn = document.getElementById('salesBtn');
const reportsBtn = document.getElementById('reportsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const productForm = document.getElementById('productForm');
const inventoryBody = document.getElementById('inventoryBody');
const salesBody = document.getElementById('salesBody');
const lowStockBody = document.getElementById('lowStockBody');
const searchInput = document.getElementById('searchInput');
const saleForm = document.getElementById('saleForm');
const saleProduct = document.getElementById('saleProduct');
const totalProductsEl = document.getElementById('totalProducts');
const totalStockEl = document.getElementById('totalStock');
const lowStockCountEl = document.getElementById('lowStockCount');
const todaysSalesEl = document.getElementById('todaysSales');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const inventoryCount = document.getElementById('inventoryCount');
const salesCount = document.getElementById('salesCount');
const reportPeriod = document.getElementById('reportPeriod');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const topSellingBody = document.getElementById('topSellingBody');

// Chart elements
const salesChartCanvas = document.getElementById('salesChart');
const categoryChartCanvas = document.getElementById('categoryChart');

// Chart instances
let salesChart = null;
let categoryChart = null;

// Current session data
let currentPharmacy = null;
let currentUser = null;
let currentEditProductId = null;

// Check if user is already logged in
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await initializeApp(session.user);
    } else {
        showLoginScreen();
    }
}

// Show login screen
function showLoginScreen() {
    welcomeScreen.classList.add('active');
    mainApp.classList.remove('active');
}

// Initialize the app with authenticated user
async function initializeApp(user) {
    try {
        // Get user's pharmacy association
        const { data: userPharmacy, error: pharmacyError } = await supabaseClient
            .from('user_pharmacies')
            .select(`
                role,
                pharmacies(id, name)
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (pharmacyError) {
            console.error('Error fetching user pharmacy:', pharmacyError);
            alert('User not associated with any pharmacy. Please contact administrator.');
            await supabaseClient.auth.signOut();
            return;
        }

        // Set current session
        currentPharmacy = {
            id: userPharmacy.pharmacies.id,
            name: userPharmacy.pharmacies.name
        };
        currentUser = {
            id: user.id,
            email: user.email,
            role: userPharmacy.role
        };

        // Apply role-based UI changes
        applyRolePermissions();

        // Update UI
        currentUserDisplay.textContent = `${currentUser.email} (${currentUser.role})`;
        currentPharmacyDisplay.textContent = currentPharmacy.name;
        dashboardTitle.textContent = `${currentPharmacy.name} Dashboard`;

        // Switch to main app
        welcomeScreen.classList.remove('active');
        mainApp.classList.add('active');

        // Load initial data based on role
        if (currentUser.role === 'manager') {
            await loadInventory();
        } else {
            // Staff default to sales section
            showSection('sales');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing application. Please try logging in again.');
        await supabaseClient.auth.signOut();
    }
}

// Apply role-based permissions to UI
function applyRolePermissions() {
    if (currentUser.role === 'staff') {
        // Hide inventory and reports sections for staff
        inventorySection.style.display = 'none';
        reportsSection.style.display = 'none';
        
        // Hide inventory and reports navigation buttons
        inventoryBtn.style.display = 'none';
        reportsBtn.style.display = 'none';
        
        // Update dashboard title for staff
        dashboardTitle.textContent = `${currentPharmacy.name} - Sales Terminal`;
    } else if (currentUser.role === 'manager') {
        // Show all sections for managers
        inventorySection.style.display = 'block';
        reportsSection.style.display = 'block';
        inventoryBtn.style.display = 'flex';
        reportsBtn.style.display = 'flex';
    }
}

// Login event
loginBtn.addEventListener('click', async () => {
    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Login error:', error);
            alert('Invalid credentials. Please check your email and password.');
            return;
        }
        
        // Initialize app with authenticated user
        await initializeApp(data.user);
    } catch (error) {
        console.error('Login error:', error);
        alert('Authentication failed. Please check your credentials.');
    }
});

// Logout event
logoutBtn.addEventListener('click', async () => {
    try {
        await supabaseClient.auth.signOut();
        
        // Clear session data
        currentPharmacy = null;
        currentUser = null;
        
        // Reset form
        usernameInput.value = '';
        passwordInput.value = '';
        
        // Switch back to welcome screen
        mainApp.classList.remove('active');
        welcomeScreen.classList.add('active');
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Export report functionality
exportReportBtn.addEventListener('click', () => {
    if (currentUser?.role !== 'manager') {
        alert('Access denied. Only managers can export reports.');
        return;
    }
    
    // In a real application, this would generate and download a PDF/Excel file
    alert('Export functionality would generate a comprehensive report with all the current data shown in the reports section.');
});

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        await initializeApp(session.user);
    } else if (event === 'SIGNED_OUT') {
        showLoginScreen();
    }
});

// Report period change event
reportPeriod.addEventListener('change', function() {
    if (this.value === 'custom') {
        startDate.style.display = 'inline-block';
        endDate.style.display = 'inline-block';
    } else {
        startDate.style.display = 'none';
        endDate.style.display = 'none';
    }
    loadReports(); // Reload reports with new period
});

// Apply filter button event
applyFilterBtn.addEventListener('click', loadReports);

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Navigation
inventoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser?.role === 'staff') {
        alert('Access denied. Only managers can access inventory management.');
        return;
    }
    showSection('inventory');
});
salesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('sales');
});
reportsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser?.role === 'staff') {
        alert('Access denied. Only managers can access reports.');
        return;
    }
    showSection('reports');
});
settingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Settings functionality coming soon!');
});

function showSection(sectionName) {
    // Check role permissions
    if (sectionName === 'inventory' && currentUser?.role === 'staff') {
        alert('Access denied. Only managers can access inventory management.');
        return;
    }
    if (sectionName === 'reports' && currentUser?.role === 'staff') {
        alert('Access denied. Only managers can access reports.');
        return;
    }

    // Hide all sections
    inventorySection.classList.remove('active');
    salesSection.classList.remove('active');
    reportsSection.classList.remove('active');
    
    // Remove active class from all buttons
    inventoryBtn.classList.remove('active');
    salesBtn.classList.remove('active');
    reportsBtn.classList.remove('active');
    settingsBtn.classList.remove('active');
    
    // Show selected section and activate button
    if (sectionName === 'inventory') {
        inventorySection.classList.add('active');
        inventoryBtn.classList.add('active');
        loadInventory();
    } else if (sectionName === 'sales') {
        salesSection.classList.add('active');
        salesBtn.classList.add('active');
        loadSales();
        loadProductsForSale();
    } else if (sectionName === 'reports') {
        reportsSection.classList.add('active');
        reportsBtn.classList.add('active');
        loadReports();
    }
}

// Form handling - only allow if user is manager
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (currentUser?.role !== 'manager') {
        alert('Access denied. Only managers can manage inventory.');
        return;
    }
    
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const category = document.getElementById('productCategory').value;
    
    // Add pharmacy ID to the data
    const productData = {
        name,
        price,
        quantity,
        category,
        pharmacy_id: currentPharmacy.id
    };
    
    if (currentEditProductId) {
        // Update existing product
        const { error } = await supabaseClient
            .from('products')
            .update(productData)
            .eq('id', currentEditProductId);
        
        if (error) {
            console.error('Error updating product:', error);
            alert('Error updating product');
        } else {
            alert('Product updated successfully!');
            resetForm();
            loadInventory();
        }
    } else {
        // Insert new product
        const { error } = await supabaseClient
            .from('products')
            .insert([productData]);
        
        if (error) {
            console.error('Error adding product:', error);
            alert('Error adding product');
        } else {
            alert('Product added successfully!');
            resetForm();
            loadInventory();
        }
    }
});

saleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = parseInt(saleProduct.value);
    const quantitySold = parseInt(document.getElementById('saleQuantity').value);
    const customer = document.getElementById('saleCustomer').value || null;
    
    // Get product details
    const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (productError) {
        console.error('Error getting product:', productError);
        alert('Error getting product details');
        return;
    }
    
    // Check if enough stock is available
    if (quantitySold > product.quantity) {
        alert(`Not enough stock available. Only ${product.quantity} items in stock.`);
        return;
    }
    
    // Calculate total price
    const totalPrice = quantitySold * product.price;
    
    // Insert sale record
    const { error: saleError } = await supabaseClient
        .from('sales')
        .insert([{
            product_id: productId,
            quantity_sold: quantitySold,
            total_price: totalPrice,
            customer_name: customer,
            pharmacy_id: currentPharmacy.id
        }]);
    
    if (saleError) {
        console.error('Error recording sale:', saleError);
        alert('Error recording sale');
        return;
    }
    
    // Update product quantity
    const newQuantity = product.quantity - quantitySold;
    const { error: updateError } = await supabaseClient
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', productId);
    
    if (updateError) {
        console.error('Error updating product quantity:', updateError);
        alert('Error updating product quantity');
        return;
    }
    
    alert('Sale recorded successfully!');
    saleForm.reset();
    loadInventory(); // Only if user is manager
    loadSales();
    loadReports(); // Only if user is manager
});

// Load inventory data - only for managers
async function loadInventory(searchTerm = '') {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    if (currentUser?.role !== 'manager') {
        return; // Staff can't access inventory
    }
    
    let query = supabaseClient
        .from('products')
        .select('*')
        .eq('pharmacy_id', currentPharmacy.id)
        .order('name');
    
    if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error loading inventory:', error);
        return;
    }
    
    inventoryBody.innerHTML = '';
    
    data.forEach(product => {
        const row = document.createElement('tr');
        
        // Determine status based on quantity
        let statusClass = 'status-normal';
        let statusText = 'Normal';
        if (product.quantity <= 5) {
            statusClass = 'status-low';
            statusText = 'Low Stock';
        } else if (product.quantity === 0) {
            statusClass = 'status-out';
            statusText = 'Out of Stock';
        }
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${product.category}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        inventoryBody.appendChild(row);
    });
    
    // Update inventory count
    inventoryCount.textContent = `${data.length} items`;
}

// Load sales data - available to both staff and managers
async function loadSales() {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    const { data, error } = await supabaseClient
        .from('sales')
        .select(`
            id,
            quantity_sold,
            total_price,
            sale_date,
            customer_name,
            products(name)
        `)
        .eq('pharmacy_id', currentPharmacy.id)
        .order('sale_date', { ascending: false })
        .limit(10); // Show last 10 sales
    
    if (error) {
        console.error('Error loading sales:', error);
        return;
    }
    
    salesBody.innerHTML = '';
    
    data.forEach(sale => {
        const saleDate = new Date(sale.sale_date).toLocaleDateString();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.products?.name || 'N/A'}</td>
            <td>${sale.quantity_sold}</td>
            <td>$${sale.total_price.toFixed(2)}</td>
            <td>${saleDate}</td>
            <td>${sale.customer_name || 'Walk-in'}</td>
        `;
        salesBody.appendChild(row);
    });
    
    // Update sales count
    salesCount.textContent = `${data.length} sales`;
}

// Load products for sale dropdown - available to both staff and managers
async function loadProductsForSale() {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, quantity')
        .eq('pharmacy_id', currentPharmacy.id)
        .order('name');
    
    if (error) {
        console.error('Error loading products for sale:', error);
        return;
    }
    
    // Clear existing options except the first one
    saleProduct.innerHTML = '<option value="">Select Product</option>';
    
    data.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.quantity} in stock)`;
        option.disabled = product.quantity <= 0; // Disable if out of stock
        saleProduct.appendChild(option);
    });
}

// Get date range based on selected period
function getDateRange() {
    const period = reportPeriod.value;
    const today = new Date();
    
    let startDate, endDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(today.setHours(0, 0, 0, 0));
            endDate = new Date(today.setHours(23, 59, 59, 999));
            break;
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);
            
            startDate = startOfWeek;
            endDate = endOfWeek;
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'custom':
            if (startDate.value && endDate.value) {
                startDate = new Date(startDate.value);
                endDate = new Date(endDate.value);
                // Add time to end date
                endDate.setHours(23, 59, 59, 999);
            } else {
                // Default to month if custom dates not set
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            }
            break;
        default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Format dates for Supabase query
    return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };
}

// Load report data - only for managers
async function loadReports() {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    if (currentUser?.role !== 'manager') {
        return; // Staff can't access reports
    }
    
    const dateRange = getDateRange();
    
    // Load inventory stats for current pharmacy
    const { count: totalProducts, error: countError } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact' })
        .eq('pharmacy_id', currentPharmacy.id);
    
    if (!countError) {
        totalProductsEl.textContent = totalProducts || 0;
    }
    
    // Calculate total stock for current pharmacy
    const { data: inventoryData, error: inventoryError } = await supabaseClient
        .from('products')
        .select('quantity')
        .eq('pharmacy_id', currentPharmacy.id);
    
    if (!inventoryError && inventoryData) {
        const totalStock = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
        totalStockEl.textContent = totalStock;
    }
    
    // Count low stock items for current pharmacy
    const { count: lowStockCount, error: lowStockError } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact' })
        .eq('pharmacy_id', currentPharmacy.id)
        .lte('quantity', 5);
    
    if (!lowStockError) {
        lowStockCountEl.textContent = lowStockCount || 0;
    }
    
    // Calculate sales for selected period
    const { data: periodSales, error: salesError } = await supabaseClient
        .from('sales')
        .select('total_price, sale_date')
        .eq('pharmacy_id', currentPharmacy.id)
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end);
    
    if (!salesError && periodSales) {
        const periodTotal = periodSales.reduce((sum, sale) => sum + sale.total_price, 0);
        // Format the sales amount appropriately based on the period
        switch(reportPeriod.value) {
            case 'today':
                todaysSalesEl.textContent = `$${periodTotal.toFixed(2)}`;
                break;
            case 'week':
                todaysSalesEl.textContent = `$${periodTotal.toFixed(2)} (Week)`;
                break;
            case 'month':
                todaysSalesEl.textContent = `$${periodTotal.toFixed(2)} (Month)`;
                break;
            case 'year':
                todaysSalesEl.textContent = `$${periodTotal.toFixed(2)} (Year)`;
                break;
            case 'custom':
                todaysSalesEl.textContent = `$${periodTotal.toFixed(2)} (Custom)`;
                break;
        }
    }
    
    // Load low stock items for current pharmacy
    const { data: lowStockItems, error: lowStockItemsError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('pharmacy_id', currentPharmacy.id)
        .lte('quantity', 5)
        .order('quantity');
    
    if (!lowStockItemsError && lowStockItems) {
        lowStockBody.innerHTML = '';
        
        lowStockItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.category}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct(${item.id})">
                        <i class="fas fa-edit"></i> Restock
                    </button>
                </td>
            `;
            lowStockBody.appendChild(row);
        });
    }
    
    // Load top selling products for the period
    await loadTopSellingProducts(dateRange);
    
    // Load sales trend data for the chart
    await loadSalesTrend(dateRange);
    
    // Load category distribution data for the chart
    await loadCategoryDistribution(dateRange);
}

// Load top selling products for the period
async function loadTopSellingProducts(dateRange) {
    // Get sales grouped by product for the period
    const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select(`
            product_id,
            SUM(quantity_sold) as total_quantity,
            SUM(total_price) as total_revenue,
            products(name)
        `)
        .eq('pharmacy_id', currentPharmacy.id)
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)
        .group('product_id, products.name')
        .order('total_quantity', { ascending: false })
        .limit(10);
    
    if (salesError) {
        console.error('Error loading top selling products:', salesError);
        return;
    }
    
    topSellingBody.innerHTML = '';
    
    if (salesData && salesData.length > 0) {
        salesData.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.products?.name || 'Unknown Product'}</td>
                <td>${sale.total_quantity}</td>
                <td>$${parseFloat(sale.total_revenue).toFixed(2)}</td>
            `;
            topSellingBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3">No sales data available for this period</td>
        `;
        topSellingBody.appendChild(row);
    }
}

// Load sales trend data for the chart
async function loadSalesTrend(dateRange) {
    // Get daily sales for the period
    const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select(`
            DATE_TRUNC('day', sale_date::timestamp) as day,
            SUM(total_price) as daily_total
        `)
        .eq('pharmacy_id', currentPharmacy.id)
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)
        .group('day')
        .order('day');
    
    if (salesError) {
        console.error('Error loading sales trend:', salesError);
        return;
    }
    
    // Prepare data for the chart
    const labels = [];
    const data = [];
    
    if (salesData && salesData.length > 0) {
        salesData.forEach(sale => {
            // Format the date for display
            const date = new Date(sale.day);
            labels.push(date.toLocaleDateString());
            data.push(parseFloat(sale.daily_total));
        });
    }
    
    // Destroy existing chart if it exists
    if (salesChart) {
        salesChart.destroy();
    }
    
    // Create new chart
    salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales ($)',
                data: data,
                borderColor: '#2e7d32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Load category distribution data for the chart
async function loadCategoryDistribution(dateRange) {
    // Get sales grouped by product category for the period
    const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select(`
            products(category),
            SUM(total_price) as category_total
        `)
        .eq('pharmacy_id', currentPharmacy.id)
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)
        .group('products.category')
        .order('category_total', { ascending: false });
    
    if (salesError) {
        console.error('Error loading category distribution:', salesError);
        return;
    }
    
    // Prepare data for the chart
    const labels = [];
    const data = [];
    const backgroundColors = [
        '#2e7d32', '#ff9800', '#2196f3', '#f44336', '#9c27b0', 
        '#ff5722', '#795548', '#607d8b', '#4caf50', '#ffc107'
    ];
    
    if (salesData && salesData.length > 0) {
        salesData.forEach(sale => {
            labels.push(sale.products?.category || 'Uncategorized');
            data.push(parseFloat(sale.category_total));
        });
    }
    
    // Destroy existing chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Create new chart
    categoryChart = new Chart(categoryChartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Edit product - only for managers
async function editProduct(id) {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    if (currentUser?.role !== 'manager') {
        alert('Access denied. Only managers can edit products.');
        return;
    }
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('pharmacy_id', currentPharmacy.id)
        .single();
    
    if (error) {
        console.error('Error fetching product:', error);
        return;
    }
    
    document.getElementById('productId').value = data.id;
    document.getElementById('productName').value = data.name;
    document.getElementById('productPrice').value = data.price;
    document.getElementById('productQuantity').value = data.quantity;
    document.getElementById('productCategory').value = data.category;
    
    currentEditProductId = id;
    
    // Change button text and show cancel button
    document.getElementById('saveProductBtn').textContent = 'Update Product';
    document.getElementById('saveProductBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Update Product';
    cancelEditBtn.style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Delete product - only for managers
async function deleteProduct(id) {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
    if (currentUser?.role !== 'manager') {
        alert('Access denied. Only managers can delete products.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id)
            .eq('pharmacy_id', currentPharmacy.id);
        
        if (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        } else {
            alert('Product deleted successfully!');
            loadInventory();
        }
    }
}

// Cancel edit
cancelEditBtn.addEventListener('click', resetForm);

// Reset form
function resetForm() {
    productForm.reset();
    currentEditProductId = null;
    document.getElementById('saveProductBtn').textContent = 'Save Product';
    document.getElementById('saveProductBtn').innerHTML = '<i class="fas fa-save"></i> Save Product';
    cancelEditBtn.style.display = 'none';
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    if (currentUser?.role === 'manager') {
        loadInventory(e.target.value);
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    await checkSession();
    
    // Check if Supabase is configured properly
    if (supabaseUrl.includes('YOUR_PROJECT') || supabaseKey.includes('YOUR_ANON_KEY')) {
        alert('Please configure your Supabase credentials in script.js before using the application.');
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});