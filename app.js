import { supabase } from './supabase.js';
import { userService } from './user-service.js';

// Display user info with role will be handled after initialization
// User authentication and profile loading happens in init()

// DOM Elements
const medicineTableBody = document.getElementById('medicine-table-body');
const addMedicineForm = document.getElementById('add-medicine-form');
const logoutButton = document.getElementById('logout-button');
const userEmail = document.getElementById('user-email');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-medicine-form');
const closeModal = document.querySelector('.close');
const alertContainer = document.getElementById('alert-container');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Sales Elements
const medicineSearch = document.getElementById('medicine-search');
const addToCartBtn = document.getElementById('add-to-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const processSaleBtn = document.getElementById('process-sale');
const salesAlertContainer = document.getElementById('sales-alert-container');
const salesTableBody = document.getElementById('sales-table-body');

// Sales Details Modal
const salesDetailsModal = document.getElementById('sales-details-modal');
const salesDetailsContent = document.getElementById('sales-details-content');
const salesDetailsClose = salesDetailsModal?.querySelector('.close');

// The user email is now handled in the user service initialization
// Display user info with role happens after user service initialization

// Global variables
let medicines = [];
let filteredMedicines = [];
let cartItems = [];
let currentSaleId = 1;

// Tab Navigation with Persistence and Role-Based Access
function setActiveTab(tabName) {
    console.log('Setting active tab:', tabName);
    
    // Check if user has permission to access this tab
    if (!canAccessTab(tabName)) {
        console.log(`User ${userService.getProfile()?.role || 'unknown'} cannot access ${tabName} tab`);
        // Redirect to first allowed tab
        const firstAllowedTab = getAllowedTabs()[0] || 'sales';
        if (firstAllowedTab !== tabName) {
            console.log('Redirecting to allowed tab:', firstAllowedTab);
            setActiveTab(firstAllowedTab);
            return;
        }
    }
    
    // Update active tab button
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        // Also remove any style overrides
        btn.style.removeProperty('display');
        btn.style.removeProperty('visibility');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Show corresponding content
    tabContents.forEach(content => {
        content.classList.remove('active');
        // Also remove any style overrides
        content.style.removeProperty('display');
        content.style.removeProperty('visibility');
        
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });
    
    // Refresh data based on tab
    if (tabName === 'inventory') {
        refreshMedicines();
        userService.logActivity('accessed_inventory', 'Viewed inventory management');
    } else if (tabName === 'sales') {
        loadSalesData();
        userService.logActivity('accessed_sales', 'Viewed sales interface');
    } else if (tabName === 'reports') {
        loadReportsData();
        userService.logActivity('accessed_reports', 'Viewed reports dashboard');
    } else if (tabName === 'activities') {
        loadActivityLogs();
        userService.logActivity('accessed_activities', 'Viewed activity logs');
    }
    
    // Save to localStorage
    localStorage.setItem('activeTab', tabName);
    console.log('Active tab set to:', tabName);
}

// Check if user can access a specific tab
function canAccessTab(tabName) {
    const allowedTabs = getAllowedTabs();
    return allowedTabs.includes(tabName);
}

// Get tabs allowed for current user role
function getAllowedTabs() {
    // Check if we have a user profile loaded
    const profile = userService.getProfile();
    
    if (profile && profile.role === 'admin') {
        return ['inventory', 'sales', 'reports', 'activities']; // Added activities tab for admins
    } else {
        // Default to staff access if no profile or role is staff
        console.log('Defaulting to staff access - profile:', profile);
        return ['sales']; // Staff can only access sales
    }
}

// Safe way to check user role
function isUserAdmin() {
    const profile = userService.getProfile();
    return profile && profile.role === 'admin';
}

// Safe way to check if user is staff
function isUserStaff() {
    const profile = userService.getProfile();
    // Default to staff if no profile is loaded
    return !profile || !profile.role || profile.role === 'staff';
}

// Initialize tab visibility based on user role
function initializeTabVisibility() {
    const allowedTabs = getAllowedTabs();
    console.log('Initializing tab visibility for allowed tabs:', allowedTabs);
    
    tabButtons.forEach(button => {
        const tabName = button.dataset.tab;
        console.log('Processing tab button:', tabName, 'Allowed:', allowedTabs.includes(tabName));
        if (allowedTabs.includes(tabName)) {
            button.style.display = 'block';
            button.style.visibility = 'visible';
            button.style.removeProperty('display'); // Remove any previous display property
            button.style.removeProperty('visibility'); // Remove any previous visibility property
        } else {
            button.style.display = 'none';
            button.style.visibility = 'hidden';
        }
    });
    
    // Hide tab content for unauthorized tabs
    tabContents.forEach(content => {
        const tabName = content.id.replace('-tab', '');
        console.log('Processing tab content:', tabName, 'Allowed:', allowedTabs.includes(tabName));
        if (allowedTabs.includes(tabName)) {
            content.style.display = 'block';
            content.style.visibility = 'visible';
            content.style.removeProperty('display'); // Remove any previous display property
            content.style.removeProperty('visibility'); // Remove any previous visibility property
        } else {
            content.style.display = 'none';
            content.style.visibility = 'hidden';
        }
    });
    
    // Force reflow to ensure changes take effect
    document.body.offsetHeight;
}

// Load saved tab on page load
function loadSavedTab() {
    // Wait a bit to ensure DOM is fully loaded and user service is initialized
    setTimeout(() => {
        const allowedTabs = getAllowedTabs();
        const savedTab = localStorage.getItem('activeTab');
        
        // Check if saved tab is allowed for current user, otherwise use first allowed tab
        const tabToLoad = savedTab && allowedTabs.includes(savedTab) ? savedTab : allowedTabs[0] || 'sales';
        
        console.log('Loading tab:', tabToLoad, 'from saved:', savedTab, 'allowed:', allowedTabs);
        setActiveTab(tabToLoad);
    }, 100); // Small delay to ensure everything is initialized
}

// Tab click handlers
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        console.log('Tab clicked:', tabName);
        
        // Check if user has access to this tab
        if (canAccessTab(tabName)) {
            setActiveTab(tabName);
        } else {
            console.log('Access denied to tab:', tabName);
            // Optionally show an alert
            alert('You do not have permission to access this tab.');
        }
    });
});

// Load saved tab when page loads
loadSavedTab();

// Show alert messages
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Sales Functions
function showSalesAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    salesAlertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function updateCartDisplay() {
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">No items in cart</p>';
        processSaleBtn.disabled = true;
        cartTotalElement.textContent = '₵0.00';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = '';
    
    cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.setAttribute('data-cart-index', index);
        
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong><br>
                <small>${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}</small>
            </div>
            <div class="cart-item-actions">
                <button class="btn btn-sm decrease-btn" data-index="${index}" style="background: var(--warning-color); color: white;">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity-display" style="padding: 0 0.75rem; font-weight: bold;">${item.quantity}</span>
                <button class="btn btn-sm increase-btn" data-index="${index}" style="background: var(--primary-color); color: white;">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-danger btn-sm remove-btn" data-index="${index}" style="margin-left: 0.75rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Add event listeners after elements are created
    attachCartEventListeners();
    
    cartTotalElement.textContent = formatCurrency(total);
    processSaleBtn.disabled = false;
}

function attachCartEventListeners() {
    // Remove existing listeners to prevent duplicates
    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.removeEventListener('click', handleDecreaseClick);
        btn.addEventListener('click', handleDecreaseClick);
    });
    
    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.removeEventListener('click', handleIncreaseClick);
        btn.addEventListener('click', handleIncreaseClick);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemoveClick);
        btn.addEventListener('click', handleRemoveClick);
    });
}

function handleDecreaseClick(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    decreaseQuantity(index);
}

function handleIncreaseClick(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    increaseQuantity(index);
}

function handleRemoveClick(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    removeFromCart(index);
}

function decreaseQuantity(index) {
    console.log('Decreasing quantity for index:', index);
    console.log('Current cart items:', cartItems);
    
    if (cartItems[index].quantity > 1) {
        cartItems[index].quantity -= 1;
        showSalesAlert(`${cartItems[index].name} quantity decreased to ${cartItems[index].quantity}`);
    } else {
        const itemName = cartItems[index].name;
        cartItems.splice(index, 1);
        showSalesAlert(`${itemName} removed from cart`);
    }
    
    updateCartDisplay();
}

function increaseQuantity(index) {
    console.log('Increasing quantity for index:', index);
    console.log('Current cart items:', cartItems);
    
    const item = cartItems[index];
    const medicine = medicines.find(m => m.id === item.id);
    
    if (medicine && item.quantity < medicine.quantity) {
        cartItems[index].quantity += 1;
        showSalesAlert(`${item.name} quantity increased to ${cartItems[index].quantity}`);
        updateCartDisplay();
    } else {
        showSalesAlert(`Cannot exceed available stock of ${medicine ? medicine.quantity : 0}`, 'error');
    }
}

function removeFromCart(index) {
    console.log('Removing item at index:', index);
    console.log('Current cart items:', cartItems);
    
    const itemName = cartItems[index].name;
    cartItems.splice(index, 1);
    showSalesAlert(`${itemName} completely removed from cart`);
    updateCartDisplay();
}

// Load sales data
async function loadSalesData() {
    console.log('Loading sales data...');
    
    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .order('sale_date', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Error loading sales:', error);
            return;
        }
        
        displaySalesHistory(sales);
        
        // Log activity for staff users
        if (userService.isStaff()) {
            userService.logActivity('viewed_sales_history', `Viewed ${sales ? sales.length : 0} recent sales records`);
        }
    } catch (error) {
        console.error('Error in loadSalesData:', error);
    }
}

function displaySalesHistory(sales) {
    const salesTableBody = document.getElementById('sales-table-body');
    
    if (!sales || sales.length === 0) {
        salesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No sales recorded yet
                </td>
            </tr>
        `;
        return;
    }
    
    // Group sales by date/customer to show as transactions
    const groupedSales = groupSalesByTransaction(sales);
    
    salesTableBody.innerHTML = '';
    
    groupedSales.forEach(saleGroup => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(saleGroup.sale_date)}</td>
            <td>${saleGroup.customer_name}</td>
            <td>${saleGroup.items_count} items</td>
            <td>${formatCurrency(saleGroup.total_amount)}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="viewSaleDetails(${saleGroup.sale_id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        
        salesTableBody.appendChild(row);
    });
}

// Show detailed sale information in modal
function showSaleDetailsModal(sale) {
    // Create or get the modal element
    let modal = document.getElementById('sale-details-modal');
    
    if (!modal) {
        // Create the modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'sale-details-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <span class="close">&times;</span>
                <div id="sale-details-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Format the sale details
    const content = document.getElementById('sale-details-content');
    content.innerHTML = `
        <h2><i class="fas fa-receipt"></i> Sale Details</h2>
        <div class="sale-info-grid">
            <div class="info-item">
                <label>Sale ID:</label>
                <span>#${sale.id}</span>
            </div>
            <div class="info-item">
                <label>Customer:</label>
                <span>${sale.customer_name}</span>
            </div>
            <div class="info-item">
                <label>Date:</label>
                <span>${formatDateTime(sale.sale_date)}</span>
            </div>
            <div class="info-item">
                <label>Product:</label>
                <span>${sale.product_name}</span>
            </div>
            <div class="info-item">
                <label>Quantity Sold:</label>
                <span>${sale.quantity_sold}</span>
            </div>
            <div class="info-item">
                <label>Unit Price:</label>
                <span>${formatCurrency(sale.unit_price)}</span>
            </div>
            <div class="info-item">
                <label>Total Amount:</label>
                <span style="font-weight: bold; color: var(--primary-color);">${formatCurrency(sale.total_amount)}</span>
            </div>
            ${sale.product_id ? `
            <div class="info-item">
                <label>Product ID:</label>
                <span>${sale.product_id}</span>
            </div>` : ''}
        </div>
        
        <div class="detail-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('sale-details-modal').style.display='none'">
                <i class="fas fa-times"></i> Close
            </button>
            <button class="btn btn-primary" onclick="printSaleReceipt(${sale.id})">
                <i class="fas fa-print"></i> Print Receipt
            </button>
        </div>
    `;
    
    // Show the modal
    modal.style.display = 'block';
}

// Print sale receipt
window.printSaleReceipt = function(saleId) {
    // Create printable receipt
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    // Get sale details (you'd fetch this from database in real implementation)
    const sale = {
        id: saleId,
        customer_name: 'Walk-in Customer',
        sale_date: new Date().toLocaleString(),
        product_name: 'Sample Product',
        quantity_sold: 1,
        unit_price: 10.00,
        total_amount: 10.00
    };
    
    const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sale Receipt #${saleId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    max-width: 300px; 
                    margin: 0 auto; 
                }
                .receipt-header { 
                    text-align: center; 
                    border-bottom: 2px solid #000; 
                    padding-bottom: 10px; 
                    margin-bottom: 20px; 
                }
                .receipt-item { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 10px; 
                }
                .total { 
                    border-top: 1px solid #000; 
                    padding-top: 10px; 
                    font-weight: bold; 
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h2>PHARMACARE</h2>
                <p>Sales Receipt</p>
                <p>Receipt #: ${saleId}</p>
                <p>${sale.sale_date}</p>
            </div>
            
            <div class="receipt-item">
                <span>Customer:</span>
                <span>${sale.customer_name}</span>
            </div>
            
            <div class="receipt-item">
                <span>Item:</span>
                <span>${sale.product_name}</span>
            </div>
            
            <div class="receipt-item">
                <span>Quantity:</span>
                <span>${sale.quantity_sold}</span>
            </div>
            
            <div class="receipt-item">
                <span>Unit Price:</span>
                <span>${formatCurrency(sale.unit_price)}</span>
            </div>
            
            <div class="receipt-item total">
                <span>TOTAL:</span>
                <span>${formatCurrency(sale.total_amount)}</span>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p>Thank you for your purchase!</p>
                <p>www.pharmacare.com</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
}

function groupSalesByTransaction(sales) {
    // Group individual sales records by date and customer to form transactions
    const grouped = {};
    
    sales.forEach(sale => {
        const key = `${sale.customer_name}_${sale.sale_date.split('T')[0]}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                sale_date: sale.sale_date,
                customer_name: sale.customer_name,
                items_count: 0,
                total_amount: 0,
                sale_id: sale.id,
                items: []
            };
        }
        
        grouped[key].items_count += sale.quantity_sold;
        grouped[key].total_amount += sale.total_amount;
        grouped[key].items.push({
            name: sale.product_name,
            quantity: sale.quantity_sold,
            unit_price: sale.unit_price,
            total: sale.total_amount
        });
    });
    
    return Object.values(grouped).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
}

// Make the function globally available
window.viewSaleDetails = async function(saleId) {
    console.log('View button clicked for sale ID:', saleId);
    
    try {
        // Fetch detailed sale information
        const { data: saleDetails, error } = await supabase
            .from('sales')
            .select('*')
            .eq('id', saleId)
            .single();
            
        if (error) {
            console.error('Error fetching sale details:', error);
            alert('Error loading sale details: ' + error.message);
            return;
        }
        
        if (!saleDetails) {
            alert('Sale not found');
            return;
        }
        
        // Display detailed modal
        showSaleDetailsModal(saleDetails);
        
    } catch (error) {
        console.error('Error in viewSaleDetails:', error);
        alert('Error: ' + error.message);
    }
};

// Test function for debugging
window.testViewFunction = function() {
    console.log('Test view function called');
    viewSaleDetails(999); // Test with a dummy ID
};

// Add event listener for sales details modal close button
if (salesDetailsClose) {
    salesDetailsClose.addEventListener('click', () => {
        if (salesDetailsModal) {
            salesDetailsModal.style.display = 'none';
        }
    });
}

// Close modal when clicking outside
if (salesDetailsModal) {
    salesDetailsModal.addEventListener('click', (event) => {
        if (event.target === salesDetailsModal) {
            salesDetailsModal.style.display = 'none';
        }
    });
}

// Load activity logs for admin users
async function loadActivityLogs() {
    console.log('Loading activity logs...');
    
    try {
        const { data: activities, error } = await supabase
            .from('activity_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);
        
        if (error) {
            console.error('Error loading activity logs:', error);
            return;
        }
        
        displayActivityLogs(activities);
    } catch (error) {
        console.error('Error in loadActivityLogs:', error);
    }
}

function displayActivityLogs(activities) {
    const activitiesContainer = document.getElementById('activities-content');
    if (!activitiesContainer) {
        console.error('Activities container not found');
        return;
    }
    
    if (!activities || activities.length === 0) {
        activitiesContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-clipboard-list" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No activity logs found
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="dashboard-header">
            <h2><i class="fas fa-clipboard-list"></i> Activity Logs</h2>
            <p>Recent user activities and system events</p>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>Recent Activities (${activities.length} total)</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    activities.forEach(activity => {
        html += `
            <tr>
                <td><strong>${activity.user_name || 'Unknown User'}</strong></td>
                <td>${activity.action}</td>
                <td>${activity.details || 'No details'}</td>
                <td>${formatDateTime(activity.timestamp)}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    activitiesContainer.innerHTML = html;
}

// Load reports data
async function loadReportsData() {
    console.log('Loading reports data...');
    try {
        // Get today's sales - using proper date range with timezone handling
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));
        
        const yesterday = new Date(Date.now() - 86400000);
        const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
        const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
        
        console.log('Today range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
        console.log('Yesterday range:', yesterdayStart.toISOString(), 'to', yesterdayEnd.toISOString());
        
        const { data: todaySales, error: todayError } = await supabase
            .from('sales')
            .select('total_amount, sale_date')
            .gte('sale_date', todayStart.toISOString())
            .lte('sale_date', todayEnd.toISOString());
        
        console.log('Today sales query result:', todaySales, todayError);
        
        const { data: yesterdaySales, error: yesterdayError } = await supabase
            .from('sales')
            .select('total_amount, sale_date')
            .gte('sale_date', yesterdayStart.toISOString())
            .lte('sale_date', yesterdayEnd.toISOString());
        
        console.log('Yesterday sales query result:', yesterdaySales, yesterdayError);
        
        let todayTotal = 0;
        let yesterdayTotal = 0;
        if (todaySales && !todayError) {
            todayTotal = todaySales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        }
        if (yesterdaySales && !yesterdayError) {
            yesterdayTotal = yesterdaySales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        }
        
        console.log('Calculated totals - Today:', todayTotal, 'Yesterday:', yesterdayTotal);
        
        // Get this month's sales - using proper date filtering
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based
        
        // First day of current month
        const monthStart = new Date(year, month, 1);
        // Last day of current month
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        // First day of last month
        const lastMonthStart = new Date(year, month - 1, 1);
        // Last day of last month
        const lastMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
        
        console.log('Current month range:', monthStart.toISOString(), 'to', monthEnd.toISOString());
        console.log('Last month range:', lastMonthStart.toISOString(), 'to', lastMonthEnd.toISOString());
        
        const { data: monthSales, error: monthError } = await supabase
            .from('sales')
            .select('total_amount, sale_date')
            .gte('sale_date', monthStart.toISOString())
            .lte('sale_date', monthEnd.toISOString());
        
        console.log('Month sales query result:', monthSales, monthError);
        
        const { data: lastMonthSales, error: lastMonthError } = await supabase
            .from('sales')
            .select('total_amount, sale_date')
            .gte('sale_date', lastMonthStart.toISOString())
            .lte('sale_date', lastMonthEnd.toISOString());
        
        console.log('Last month sales query result:', lastMonthSales, lastMonthError);
        
        let monthTotal = 0;
        let lastMonthTotal = 0;
        if (monthSales && !monthError) {
            monthTotal = monthSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        }
        if (lastMonthSales && !lastMonthError) {
            lastMonthTotal = lastMonthSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        }
        
        console.log('Calculated monthly totals - Current:', monthTotal, 'Last:', lastMonthTotal);
        
        // Get best selling product
        const { data: bestSellingData, error: bestSellingError } = await supabase
            .from('sales')
            .select('product_name, quantity_sold')
            .order('sale_date', { ascending: false })
            .limit(100); // Get more data to calculate properly
        
        console.log('Best selling raw data:', bestSellingData, bestSellingError);
        
        let bestSelling = 'No sales yet';
        let bestSellingUnits = 0;
        
        if (bestSellingData && !bestSellingError && bestSellingData.length > 0) {
            // Group by product and sum quantities
            const productTotals = {};
            bestSellingData.forEach(sale => {
                const productName = sale.product_name;
                const quantity = parseInt(sale.quantity_sold) || 0;
                productTotals[productName] = (productTotals[productName] || 0) + quantity;
            });
            
            // Find product with highest total
            let maxUnits = 0;
            for (const [product, total] of Object.entries(productTotals)) {
                if (total > maxUnits) {
                    maxUnits = total;
                    bestSelling = product;
                }
            }
            bestSellingUnits = maxUnits;
        }
        
        console.log('Best selling calculated:', bestSelling, 'Units:', bestSellingUnits);
        
        // Get active products count
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity')
            .gt('quantity', 0);
        
        const activeProducts = inventoryData && !inventoryError ? inventoryData.length : 0;
        
        console.log('Active products:', activeProducts, inventoryData, inventoryError);
        
        // Update dashboard stats
        console.log('Updating dashboard with values:', {
            todaySales: todayTotal,
            monthSales: monthTotal,
            bestSelling: bestSelling,
            bestSellingUnits: bestSellingUnits,
            activeProducts: activeProducts
        });
        
        document.getElementById('today-sales').textContent = formatCurrency(todayTotal);
        document.getElementById('month-sales').textContent = formatCurrency(monthTotal);
        document.getElementById('best-selling').textContent = bestSelling;
        document.getElementById('best-selling-units').textContent = `${bestSellingUnits} units sold`;
        document.getElementById('active-products').textContent = activeProducts;
        
        // Update trends
        const todayTrend = document.getElementById('today-trend');
        const monthTrend = document.getElementById('month-trend');
        
        if (todayTotal >= yesterdayTotal) {
            todayTrend.innerHTML = `<i class="fas fa-arrow-up"></i> +${formatCurrency(todayTotal - yesterdayTotal)} vs yesterday`;
            todayTrend.className = 'stat-trend';
        } else {
            todayTrend.innerHTML = `<i class="fas fa-arrow-down"></i> -${formatCurrency(yesterdayTotal - todayTotal)} vs yesterday`;
            todayTrend.className = 'stat-trend down';
        }
        
        if (monthTotal >= lastMonthTotal) {
            monthTrend.innerHTML = `<i class="fas fa-arrow-up"></i> +${formatCurrency(monthTotal - lastMonthTotal)} vs last month`;
            monthTrend.className = 'stat-trend';
        } else {
            monthTrend.innerHTML = `<i class="fas fa-arrow-down"></i> -${formatCurrency(lastMonthTotal - monthTotal)} vs last month`;
            monthTrend.className = 'stat-trend down';
        }
        
        // Render charts
        renderCharts();
        
        console.log('Reports data loaded successfully');
        
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('today-sales').textContent = '₵0.00';
        document.getElementById('month-sales').textContent = '₵0.00';
        document.getElementById('best-selling').textContent = '-';
        document.getElementById('best-selling-units').textContent = '0 units sold';
        document.getElementById('active-products').textContent = '0';
        
        // Show error notification
        showNotification('Error loading reports data: ' + error.message, 'error');
    }
}

// Render charts (placeholder implementation)
function renderCharts() {
    // Sales trend chart placeholder
    const salesChart = document.getElementById('sales-trend-chart');
    if (salesChart) {
        salesChart.parentElement.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Sales trend visualization will appear here</p>
                <small>Data-driven charts coming soon</small>
            </div>
        `;
    }
    
    // Category distribution chart placeholder
    const categoryChart = document.getElementById('category-distribution-chart');
    if (categoryChart) {
        categoryChart.parentElement.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Category distribution will appear here</p>
                <small>Pie chart visualization coming soon</small>
            </div>
        `;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Format date and time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
}

// Get date range for different periods
function getDateRange(period) {
    const now = new Date();
    let startDate, endDate = now.toISOString().split('T')[0];
    
    switch (period) {
        case 'today':
            startDate = endDate;
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            break;
        case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            break;
    }
    
    return { startDate, endDate };
}

// Event Listeners for Sales
if (medicineSearch) {
    // Show dropdown when user types
    medicineSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        showMedicineSuggestions(searchTerm);
    });
    
    // Hide dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!medicineSearch.contains(e.target) && !document.getElementById('medicine-search-results').contains(e.target)) {
            document.getElementById('medicine-search-results').style.display = 'none';
        }
    });
}

function showMedicineSuggestions(searchTerm) {
    const resultsContainer = document.getElementById('medicine-search-results');
    const dropdownOptions = resultsContainer.querySelector('.dropdown-options');
    
    if (!searchTerm.trim()) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const filtered = medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm) ||
        med.category.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    dropdownOptions.innerHTML = '';
    
    filtered.slice(0, 10).forEach(medicine => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.innerHTML = `
            <div class="medicine-name">${medicine.name}</div>
            <div class="medicine-details">Category: ${medicine.category || 'N/A'} | Price: ${formatCurrency(medicine.price)} | Stock: ${medicine.quantity}</div>
        `;
        option.addEventListener('click', () => {
            selectMedicine(medicine);
        });
        dropdownOptions.appendChild(option);
    });
    
    resultsContainer.style.display = 'block';
}

function selectMedicine(medicine) {
    medicineSearch.value = medicine.name;
    document.getElementById('medicine-search-results').style.display = 'none';
    
    // Check if item is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === medicine.id);
    
    if (existingItemIndex !== -1) {
        // If already in cart, increase quantity
        increaseQuantity(existingItemIndex);
    } else {
        // Add new item to cart
        addToCart(medicine);
    }
}

function addToCart(medicine) {
    if (!medicine) {
        const searchTerm = medicineSearch.value.toLowerCase();
        medicine = medicines.find(med => 
            med.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (!medicine) {
        showSalesAlert('Medicine not found', 'error');
        return;
    }
    
    if (medicine.quantity <= 0) {
        showSalesAlert('Medicine out of stock', 'error');
        return;
    }
    
    // Add to cart
    const existingItem = cartItems.find(item => item.id === medicine.id);
    if (existingItem) {
        if (existingItem.quantity >= medicine.quantity) {
            showSalesAlert('Not enough stock available', 'error');
            return;
        }
        existingItem.quantity += 1;
        showSalesAlert(`${medicine.name} quantity increased to ${existingItem.quantity}`);
    } else {
        cartItems.push({
            id: medicine.id,
            name: medicine.name,
            price: medicine.price,
            quantity: 1
        });
        showSalesAlert(`${medicine.name} added to cart (Qty: 1)`);
    }
    
    medicineSearch.value = '';
    document.getElementById('medicine-search-results').style.display = 'none';
    updateCartDisplay();
}

if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        const searchTerm = medicineSearch.value.toLowerCase();
        const medicine = medicines.find(med => 
            med.name.toLowerCase().includes(searchTerm)
        );
        
        if (!medicine) {
            showSalesAlert('Medicine not found', 'error');
            return;
        }
        
        addToCart(medicine);
    });
}

if (processSaleBtn) {
    processSaleBtn.addEventListener('click', async () => {
        if (cartItems.length === 0) return;
        
        const customerName = document.getElementById('customer-name').value || 'Walk-in Customer';
        let totalAmount = 0;
        
        // Calculate total
        cartItems.forEach(item => {
            totalAmount += item.price * item.quantity;
        });
        
        // Process sale
        try {
            // Update inventory quantities
            for (const item of cartItems) {
                const medicine = medicines.find(m => m.id === item.id);
                if (medicine) {
                    const newQuantity = medicine.quantity - item.quantity;
                    if (newQuantity < 0) {
                        showSalesAlert(`Insufficient stock for ${medicine.name}`, 'error');
                        return;
                    }
                    
                    const { error } = await supabase
                        .from('inventory')
                        .update({ quantity: newQuantity })
                        .eq('id', item.id);
                    
                    if (error) {
                        throw error;
                    }
                }
            }
            
            // Add individual sale records to database
            for (const item of cartItems) {
                const saleData = {
                    product_id: item.id,
                    product_name: item.name,
                    quantity_sold: item.quantity,
                    unit_price: item.price,
                    total_amount: item.price * item.quantity,
                    customer_name: customerName,
                    sale_date: new Date().toISOString()
                };
                
                const { error: saleError } = await supabase
                    .from('sales')
                    .insert([saleData]);
                
                if (saleError) {
                    throw saleError;
                }
            }
            
            showSalesAlert(`Sale processed successfully! Total: ${formatCurrency(totalAmount)}`, 'success');
            
            // Log staff activity
            if (userService.isStaff()) {
                userService.logActivity('processed_sale', `Processed sale for ${customerName}, Total: ${formatCurrency(totalAmount)}, Items: ${cartItems.length}`);
            }
            
            // Reset cart
            cartItems = [];
            document.getElementById('customer-name').value = '';
            updateCartDisplay();
            medicineSearch.value = '';
            document.getElementById('medicine-search-results').style.display = 'none';
            
            // Refresh inventory
            await refreshMedicines();
            
        } catch (error) {
            console.error('Error processing sale:', error);
            showSalesAlert('Error processing sale: ' + error.message, 'error');
        }
    });
}

// Check if medicine is low stock
function isLowStock(quantity) {
    return quantity <= 10;
}

// Get medicines from database
async function getMedicines() {
    console.log('Fetching medicines from database...');
    
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching medicines:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        showAlert('Error loading medicines: ' + error.message, 'error');
        return [];
    }
    
    console.log('Successfully fetched', data.length, 'medicines');
    return data || [];
}

// Display medicines in table
function displayMedicines(medicinesToDisplay) {
    console.log('Displaying medicines:', medicinesToDisplay);
    medicineTableBody.innerHTML = '';
    
    if (medicinesToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-pills" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No medicines found
            </td>
        `;
        medicineTableBody.appendChild(row);
        return;
    }
    
    medicinesToDisplay.forEach(medicine => {
        console.log('Processing medicine:', medicine);
        const row = document.createElement('tr');
        
        // Highlight low stock items
        const quantityClass = isLowStock(medicine.quantity) ? 'style="color: var(--warning-color); font-weight: bold;"' : '';
        
        row.innerHTML = `
            <td>${medicine.name}</td>
            <td><span class="category-tag category-${medicine.category || 'default'}">${medicine.category || 'N/A'}</span></td>
            <td ${quantityClass}>${medicine.quantity}</td>
            <td>${formatCurrency(medicine.price)}</td>
            <td>${medicine.supplier || 'N/A'}</td>
            <td>${formatDate(medicine.expiry_date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editMedicine(${medicine.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMedicine(${medicine.id}, '${medicine.name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        medicineTableBody.appendChild(row);
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(med => isLowStock(med.quantity)).length;
    const totalValue = medicines.reduce((sum, med) => sum + (med.quantity * med.price), 0);
    
    document.getElementById('total-medicines').textContent = totalMedicines;
    document.getElementById('low-stock').textContent = lowStockCount;
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

// Add new medicine
async function addMedicine(event) {
    event.preventDefault();
    
    console.log('Add medicine function called');
    
    const formData = new FormData(addMedicineForm);
    const medicineData = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        supplier: document.getElementById('supplier').value,
        expiry_date: document.getElementById('expiry-date').value
        // Removed description field since it doesn't exist in the database schema
    };
    
    console.log('Medicine data:', medicineData);
    
    // Validation
    if (medicineData.quantity < 0) {
        showAlert('Quantity cannot be negative', 'error');
        return;
    }
    
    if (medicineData.price < 0) {
        showAlert('Price cannot be negative', 'error');
        return;
    }
    
    if (!medicineData.name || !medicineData.category) {
        showAlert('Name and category are required', 'error');
        return;
    }
    
    console.log('Sending to Supabase...');
    
    const { data, error } = await supabase
        .from('inventory')
        .insert([medicineData])
        .select();
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
        console.error('Error adding medicine:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        showAlert('Error adding medicine: ' + error.message + ' (Code: ' + error.code + ')', 'error');
    } else {
        showAlert('Medicine added successfully!');
        addMedicineForm.reset();
        await refreshMedicines();
    }
}

// Edit medicine
async function editMedicine(id) {
    console.log('Edit medicine called with ID:', id);
    console.log('ID type:', typeof id);
    
    // Convert ID to appropriate type if needed
    const medicineId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Converted ID:', medicineId, 'Type:', typeof medicineId);
    
    const medicine = medicines.find(med => med.id === medicineId);
    console.log('Found medicine:', medicine);
    
    if (!medicine) {
        console.error('Medicine not found');
        console.error('Available medicines:', medicines.map(m => ({id: m.id, name: m.name})));
        showAlert('Medicine not found', 'error');
        return;
    }
    
    // Populate edit form
    document.getElementById('edit-id').value = medicine.id;
    document.getElementById('edit-name').value = medicine.name;
    document.getElementById('edit-category').value = medicine.category || '';
    document.getElementById('edit-quantity').value = medicine.quantity;
    document.getElementById('edit-price').value = medicine.price;
    document.getElementById('edit-supplier').value = medicine.supplier || '';
    document.getElementById('edit-expiry').value = medicine.expiry_date || '';
    
    console.log('Form populated with:', {
        id: medicine.id,
        name: medicine.name,
        category: medicine.category
    });
    
    // Show modal
    editModal.style.display = 'block';
    console.log('Edit modal displayed');
}

// Update medicine
async function updateMedicine(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const medicineData = {
        name: document.getElementById('edit-name').value,
        category: document.getElementById('edit-category').value,
        quantity: parseInt(document.getElementById('edit-quantity').value),
        price: parseFloat(document.getElementById('edit-price').value),
        supplier: document.getElementById('edit-supplier').value,
        expiry_date: document.getElementById('edit-expiry').value
        // Removed description field since it doesn't exist in database
    };
    
    const { error } = await supabase
        .from('inventory')
        .update(medicineData)
        .eq('id', id);
    
    if (error) {
        console.error('Error updating medicine:', error);
        showAlert('Error updating medicine: ' + error.message, 'error');
    } else {
        showAlert('Medicine updated successfully!');
        editModal.style.display = 'none';
        await refreshMedicines();
    }
}

// Delete medicine
async function deleteMedicine(id, name) {
    console.log('Delete medicine called with ID:', id);
    console.log('ID type:', typeof id);
    
    // Convert ID to appropriate type if needed
    const medicineId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Converted ID:', medicineId, 'Type:', typeof medicineId);
    
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', medicineId);
    
    if (error) {
        console.error('Error deleting medicine:', error);
        showAlert('Error deleting medicine: ' + error.message, 'error');
    } else {
        showAlert('Medicine deleted successfully!');
        await refreshMedicines();
    }
}

// Filter medicines
function filterMedicines() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilter = filterCategory.value;
    
    filteredMedicines = medicines.filter(medicine => {
        const matchesSearch = 
            medicine.name.toLowerCase().includes(searchTerm) ||
            (medicine.category && medicine.category.toLowerCase().includes(searchTerm)) ||
            (medicine.supplier && medicine.supplier.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || medicine.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    displayMedicines(filteredMedicines);
}

// Refresh medicines data
async function refreshMedicines() {
    medicines = await getMedicines();
    filterMedicines();
    updateDashboardStats();
}

// Event Listeners
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'auth.html';
});

addMedicineForm.addEventListener('submit', addMedicine);

editForm.addEventListener('submit', updateMedicine);

searchInput.addEventListener('input', filterMedicines);

filterCategory.addEventListener('change', filterMedicines);

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});

// Initialize the application
async function init() {
    // Initialize user service and check authentication
    const currentUser = await userService.init();
    
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Display user info with role
    const userDisplay = document.getElementById('user-email');
    const profile = userService.getProfile();
    console.log('Profile for display:', profile);
    
    if (userDisplay && profile) {
        userDisplay.textContent = `${profile.full_name} (${profile.role})`;
    } else if (userDisplay && currentUser) {
        // Fallback to just showing email if no profile
        userDisplay.textContent = currentUser.email;
    }
    
    // Initialize tab visibility based on user role
    initializeTabVisibility();
    
    // Load saved tab considering user permissions
    loadSavedTab();
    
    // Refresh medicines data
    await refreshMedicines();
    
    console.log('Application initialized for user:', userService.getProfile());
}

// Report Event Listeners
const reportPeriodSelect = document.getElementById('report-period');
const customDateRange = document.getElementById('custom-date-range');
const generateReportBtn = document.getElementById('generate-report');
const exportReportBtn = document.getElementById('export-report');
const printReportBtn = document.getElementById('print-report');

if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.style.display = 'grid';
        } else {
            customDateRange.style.display = 'none';
        }
    });
}

if (generateReportBtn) {
    generateReportBtn.addEventListener('click', generateDetailedReport);
}

if (exportReportBtn) {
    exportReportBtn.addEventListener('click', exportReportToCSV);
}

if (printReportBtn) {
    printReportBtn.addEventListener('click', printReport);
}

// Quick report cards
const quickReportCards = document.querySelectorAll('.quick-report-card');
quickReportCards.forEach(card => {
    card.addEventListener('click', function() {
        const reportType = this.dataset.report;
        generateQuickReport(reportType);
    });
});

// Generate detailed report
async function generateDetailedReport() {
    const reportType = document.getElementById('report-type').value;
    const period = document.getElementById('report-period').value;
    
    let startDate, endDate;
    
    if (period === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
    } else {
        const now = new Date();
        endDate = now.toISOString().split('T')[0];
        
        switch (period) {
            case 'today':
                startDate = endDate;
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                break;
        }
    }
    
    try {
        let reportData = {};
        
        switch (reportType) {
            case 'sales-summary':
                const { data: salesData } = await supabase
                    .from('sales')
                    .select('*')
                    .gte('sale_date', `${startDate}T00:00:00`)
                    .lte('sale_date', `${endDate}T23:59:59`)
                    .order('sale_date', { ascending: false });
                reportData = salesData || [];
                break;
                
            case 'inventory-status':
                const { data: inventoryData } = await supabase
                    .from('inventory')
                    .select('*')
                    .order('name');
                reportData = inventoryData || [];
                break;
                
            case 'low-stock-alert':
                const { data: lowStockData } = await supabase
                    .from('inventory')
                    .select('*')
                    .lt('quantity', 10)
                    .order('quantity');
                reportData = lowStockData || [];
                break;
        }
        
        displayReport(reportType, reportData, startDate, endDate);
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report: ' + error.message);
    }
}

function displayReport(type, data, startDate, endDate) {
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    let content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>PharmaCare Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PharmaCare Management System</h1>
                <h2>${getTypeDisplayName(type)} Report</h2>
                <p>Period: ${startDate} to ${endDate}</p>
            </div>
    `;
    
    switch (type) {
        case 'sales-summary':
            content += `
                <div class="summary">
                    <h3>Summary</h3>
                    <p>Total Transactions: ${data.length}</p>
                    <p>Total Revenue: ${formatCurrency(data.reduce((sum, sale) => sum + sale.total_amount, 0))}</p>
                    <p>Total Items Sold: ${data.reduce((sum, sale) => sum + sale.quantity_sold, 0)}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Customer</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach(sale => {
                content += `
                    <tr>
                        <td>${formatDate(sale.sale_date)}</td>
                        <td>${sale.product_name}</td>
                        <td>${sale.quantity_sold}</td>
                        <td>${formatCurrency(sale.unit_price)}</td>
                        <td>${formatCurrency(sale.total_amount)}</td>
                        <td>${sale.customer_name}</td>
                    </tr>
                `;
            });
            content += '</tbody></table>';
            break;
            
        case 'inventory-status':
            content += `
                <div class="summary">
                    <h3>Inventory Summary</h3>
                    <p>Total Products: ${data.length}</p>
                    <p>Low Stock Items: ${data.filter(item => item.quantity <= 10).length}</p>
                    <p>Total Inventory Value: ${formatCurrency(data.reduce((sum, item) => sum + (item.quantity * item.price), 0))}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Supplier</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach(item => {
                const status = item.quantity <= 10 ? 'Low Stock' : 'In Stock';
                const statusColor = item.quantity <= 10 ? '#ef4444' : '#10b981';
                content += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.category || 'N/A'}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${item.supplier || 'N/A'}</td>
                        <td>${formatDate(item.expiry_date)}</td>
                        <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
                    </tr>
                `;
            });
            content += '</tbody></table>';
            break;
            
        case 'low-stock-alert':
            content += `
                <div class="summary" style="background: #fee2e2; border: 1px solid #fecaca;">
                    <h3 style="color: #991b1b;">⚠️ Low Stock Alert</h3>
                    <p>Items requiring immediate attention: ${data.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Current Stock</th>
                            <th>Category</th>
                            <th>Supplier</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach(item => {
                content += `
                    <tr>
                        <td>${item.name}</td>
                        <td style="color: #ef4444; font-weight: bold;">${item.quantity}</td>
                        <td>${item.category || 'N/A'}</td>
                        <td>${item.supplier || 'N/A'}</td>
                        <td>${formatCurrency(item.price)}</td>
                    </tr>
                `;
            });
            content += '</tbody></table>';
            break;
    }
    
    content += `
        </body>
        </html>
    `;
    
    reportWindow.document.write(content);
    reportWindow.document.close();
}

function getTypeDisplayName(type) {
    const displayNames = {
        'sales-summary': 'Sales Summary',
        'inventory-status': 'Inventory Status',
        'profit-analysis': 'Profit Analysis',
        'low-stock-alert': 'Low Stock Alert',
        'expiry-report': 'Expiry Report',
        'customer-analysis': 'Customer Analysis'
    };
    return displayNames[type] || type;
}

function exportReportToCSV() {
    alert('CSV export functionality will be implemented in the next update.');
}

function printReport() {
    window.print();
}

function generateQuickReport(reportType) {
    // Set the form values based on quick report selection
    const reportTypeSelect = document.getElementById('report-type');
    const periodSelect = document.getElementById('report-period');
    
    switch (reportType) {
        case 'daily':
            reportTypeSelect.value = 'sales-summary';
            periodSelect.value = 'today';
            break;
        case 'weekly':
            reportTypeSelect.value = 'sales-summary';
            periodSelect.value = 'week';
            break;
        case 'low-stock':
            reportTypeSelect.value = 'low-stock-alert';
            periodSelect.value = 'today';
            break;
        case 'expiring':
            reportTypeSelect.value = 'expiry-report';
            periodSelect.value = 'month';
            break;
    }
    
    // Show notification
    showNotification(`Generating ${reportType.replace('-', ' ')} report...`);
    
    // Trigger report generation
    setTimeout(() => {
        generateDetailedReport();
    }, 500);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Manual refresh function for debugging
window.refreshReports = function() {
    console.log('Manually refreshing reports data...');
    loadReportsData();
};

// Make functions available globally for inline event handlers
window.editMedicine = editMedicine;
window.deleteMedicine = deleteMedicine;

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Small delay to ensure all DOM elements are fully rendered
        setTimeout(async () => {
            await init();
        }, 100);
    });
} else {
    // DOM is already loaded
    // Small delay to ensure all DOM elements are fully rendered
    setTimeout(async () => {
        init();
    }, 100);
}
