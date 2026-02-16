import { supabase } from './supabase.js';

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

// Global variables
let medicines = [];
let filteredMedicines = [];
let cartItems = [];
let currentSaleId = 1;

// Tab Navigation with Persistence and Role-Based Access
function setActiveTab(tabName) {
    console.log('Setting active tab:', tabName);

    // Update active tab button
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
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
        content.style.removeProperty('display');
        content.style.removeProperty('visibility');

        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    // Refresh data based on tab
    if (tabName === 'inventory') {
        refreshMedicines();
    } else if (tabName === 'sales') {
        loadSalesData();
    } else if (tabName === 'reports') {
        loadReportsData();
    } else if (tabName === 'activities') {
        loadActivityLogs();
    }

    // Save to localStorage
    localStorage.setItem('activeTab', tabName);
    console.log('Active tab set to:', tabName);
}

// Get tabs allowed for current user role
function getAllowedTabs() {
    return ['inventory', 'sales', 'reports', 'activities'];
}

function canAccessTab(tabName) {
    const allowedTabs = getAllowedTabs();
    return allowedTabs.includes(tabName);
}

// Safe way to check user role
function isUserAdmin() {
    return true;
}

// Safe way to check if user is staff
function isUserStaff() {
    return false;
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
    // Wait a bit to ensure DOM is fully loaded
    setTimeout(() => {
        const allowedTabs = getAllowedTabs();
        const savedTab = localStorage.getItem('activeTab');
        
        const tabToLoad = savedTab && allowedTabs.includes(savedTab) ? savedTab : allowedTabs[0] || 'sales';
        
        console.log('Loading tab:', tabToLoad, 'from saved:', savedTab, 'allowed:', allowedTabs);
        setActiveTab(tabToLoad);
    }, 100);
}

// Tab click handlers
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        console.log('Tab clicked:', tabName);
        
        if (canAccessTab(tabName)) {
            setActiveTab(tabName);
        } else {
            console.log('Access denied to tab:', tabName);
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
    
    attachCartEventListeners();
    
    cartTotalElement.textContent = formatCurrency(total);
    processSaleBtn.disabled = false;
}

function attachCartEventListeners() {
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
    let modal = document.getElementById('sale-details-modal');
    
    if (!modal) {
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
    
    modal.style.display = 'block';
}

window.printSaleReceipt = function(saleId) {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
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

window.viewSaleDetails = async function(saleId) {
    console.log('View button clicked for sale ID:', saleId);
    
    try {
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
        
        showSaleDetailsModal(saleDetails);
        
    } catch (error) {
        console.error('Error in viewSaleDetails:', error);
        alert('Error: ' + error.message);
    }
};

if (salesDetailsClose) {
    salesDetailsClose.addEventListener('click', () => {
        if (salesDetailsModal) {
            salesDetailsModal.style.display = 'none';
        }
    });
}

if (salesDetailsModal) {
    salesDetailsModal.addEventListener('click', (event) => {
        if (event.target === salesDetailsModal) {
            salesDetailsModal.style.display = 'none';
        }
    });
}

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

async function loadReportsData() {
    console.log('Loading reports data...');
    try {
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
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        const lastMonthStart = new Date(year, month - 1, 1);
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
        
        const { data: bestSellingData, error: bestSellingError } = await supabase
            .from('sales')
            .select('product_name, quantity_sold')
            .order('sale_date', { ascending: false })
            .limit(100);
        
        console.log('Best selling raw data:', bestSellingData, bestSellingError);
        
        let bestSelling = 'No sales yet';
        let bestSellingUnits = 0;
        
        if (bestSellingData && !bestSellingError && bestSellingData.length > 0) {
            const productTotals = {};
            bestSellingData.forEach(sale => {
                const productName = sale.product_name;
                const quantity = parseInt(sale.quantity_sold) || 0;
                productTotals[productName] = (productTotals[productName] || 0) + quantity;
            });
            
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
        
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity')
            .gt('quantity', 0);
        
        const activeProducts = inventoryData && !inventoryError ? inventoryData.length : 0;
        
        console.log('Active products:', activeProducts, inventoryData, inventoryError);
        
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
        
        renderCharts();
        
        console.log('Reports data loaded successfully');
        
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('today-sales').textContent = '₵0.00';
        document.getElementById('month-sales').textContent = '₵0.00';
        document.getElementById('best-selling').textContent = '-';
        document.getElementById('best-selling-units').textContent = '0 units sold';
        document.getElementById('active-products').textContent = '0';
        
        showNotification('Error loading reports data: ' + error.message, 'error');
    }
}

function renderCharts() {
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
}

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

if (medicineSearch) {
    medicineSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        showMedicineSuggestions(searchTerm);
    });
    
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
    
    const existingItemIndex = cartItems.findIndex(item => item.id === medicine.id);
    
    if (existingItemIndex !== -1) {
        increaseQuantity(existingItemIndex);
    } else {
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
        
        cartItems.forEach(item => {
            totalAmount += item.price * item.quantity;
        });
        
        try {
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
            
            cartItems = [];
            document.getElementById('customer-name').value = '';
            updateCartDisplay();
            medicineSearch.value = '';
            document.getElementById('medicine-search-results').style.display = 'none';
            
            await refreshMedicines();
            
        } catch (error) {
            console.error('Error processing sale:', error);
            showSalesAlert('Error processing sale: ' + error.message, 'error');
        }
    });
}

function isLowStock(quantity) {
    return quantity <= 10;
}

async function getMedicines() {
    console.log('Fetching medicines from database...');
    
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching medicines:', error);
        showAlert('Error loading medicines: ' + error.message, 'error');
        return [];
    }
    
    console.log('Successfully fetched', data.length, 'medicines');
    return data || [];
}

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
        const row = document.createElement('tr');
        
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

function updateDashboardStats() {
    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(med => isLowStock(med.quantity)).length;
    const totalValue = medicines.reduce((sum, med) => sum + (med.quantity * med.price), 0);
    
    document.getElementById('total-medicines').textContent = totalMedicines;
    document.getElementById('low-stock').textContent = lowStockCount;
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

async function addMedicine(event) {
    event.preventDefault();
    
    const medicineData = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        supplier: document.getElementById('supplier').value,
        expiry_date: document.getElementById('expiry-date').value
    };
    
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
    
    const { data, error } = await supabase
        .from('inventory')
        .insert([medicineData])
        .select();
    
    if (error) {
        console.error('Error adding medicine:', error);
        showAlert('Error adding medicine: ' + error.message, 'error');
    } else {
        showAlert('Medicine added successfully!');
        addMedicineForm.reset();
        await refreshMedicines();
    }
}

async function editMedicine(id) {
    const medicineId = typeof id === 'string' ? parseInt(id) : id;
    const medicine = medicines.find(med => med.id === medicineId);
    
    if (!medicine) {
        console.error('Medicine not found');
        showAlert('Medicine not found', 'error');
        return;
    }
    
    document.getElementById('edit-id').value = medicine.id;
    document.getElementById('edit-name').value = medicine.name;
    document.getElementById('edit-category').value = medicine.category || '';
    document.getElementById('edit-quantity').value = medicine.quantity;
    document.getElementById('edit-price').value = medicine.price;
    document.getElementById('edit-supplier').value = medicine.supplier || '';
    document.getElementById('edit-expiry').value = medicine.expiry_date || '';
    
    editModal.style.display = 'block';
}

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

async function deleteMedicine(id, name) {
    const medicineId = typeof id === 'string' ? parseInt(id) : id;
    
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

async function refreshMedicines() {
    medicines = await getMedicines();
    filterMedicines();
    updateDashboardStats();
}

logoutButton.addEventListener('click', async () => {
});

addMedicineForm.addEventListener('submit', addMedicine);

editForm.addEventListener('submit', updateMedicine);

searchInput.addEventListener('input', filterMedicines);

filterCategory.addEventListener('change', filterMedicines);

if (closeModal) {
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});

async function init() {
    const userActions = document.querySelector('.user-actions');
    if(userActions) {
        userActions.style.display = 'none';
    }
    
    initializeTabVisibility();
    
    loadSavedTab();
    
    await refreshMedicines();
    
    console.log('Application initialized');
}

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

const quickReportCards = document.querySelectorAll('.quick-report-card');
quickReportCards.forEach(card => {
    card.addEventListener('click', function() {
        const reportType = this.dataset.report;
        generateQuickReport(reportType);
    });
});

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
    
    showNotification(`Generating ${reportType.replace('-', ' ')} report...`);
    
    setTimeout(() => {
        generateDetailedReport();
    }, 500);
}

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

window.refreshReports = function() {
    console.log('Manually refreshing reports data...');
    loadReportsData();
};

window.editMedicine = editMedicine;
window.deleteMedicine = deleteMedicine;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        setTimeout(async () => {
            await init();
        }, 100);
    });
} else {
    setTimeout(async () => {
        init();
    }, 100);
}
