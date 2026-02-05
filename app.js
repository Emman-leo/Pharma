import { supabase } from './supabase.js';

// Authentication check
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    window.location.href = 'auth.html';
}

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

// Display user email
if (userEmail) {
    userEmail.textContent = user.email;
}

// Global variables
let medicines = [];
let filteredMedicines = [];
let cartItems = [];
let currentSaleId = 1;

// Tab Navigation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show corresponding content
        tabContents.forEach(content => {
            content.classList.remove('active');
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
        }
    });
});

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
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong><br>
                <small>${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}</small>
            </div>
            <div class="cart-item-actions">
                <button class="btn btn-sm" onclick="adjustCartItem(${index}, -1)" style="background: var(--warning-color); color: white;">
                    -
                </button>
                <span style="padding: 0 0.5rem;">${item.quantity}</span>
                <button class="btn btn-sm" onclick="adjustCartItem(${index}, 1)" style="background: var(--primary-color); color: white;">
                    +
                </button>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})" style="margin-left: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    cartTotalElement.textContent = formatCurrency(total);
    processSaleBtn.disabled = false;
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartDisplay();
}

function adjustCartItem(index, change) {
    cartItems[index].quantity += change;
    if (cartItems[index].quantity <= 0) {
        cartItems.splice(index, 1);
    }
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

function viewSaleDetails(saleId) {
    // In a full implementation, this would show detailed sale information
    console.log('Viewing sale details for ID:', saleId);
}

// Load reports data
async function loadReportsData() {
    try {
        // Get today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySales, error: todayError } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('sale_date', `${today}T00:00:00`)
            .lte('sale_date', `${today}T23:59:59`);
        
        let todayTotal = 0;
        if (todaySales) {
            todayTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
        }
        
        // Get this month's sales
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const { data: monthSales, error: monthError } = await supabase
            .from('sales')
            .select('total_amount')
            .ilike('sale_date', `${year}-${month}%`);
        
        let monthTotal = 0;
        if (monthSales) {
            monthTotal = monthSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        }
        
        // Get best selling product
        const { data: bestSellingData, error: bestSellingError } = await supabase
            .from('sales')
            .select('product_name, SUM(quantity_sold) as total_sold')
            .group('product_name')
            .order('total_sold', { ascending: false })
            .limit(1);
        
        const bestSelling = bestSellingData && bestSellingData.length > 0 
            ? `${bestSellingData[0].product_name} (${bestSellingData[0].total_sold} sold)`
            : '-';
        
        // Update dashboard stats
        document.getElementById('today-sales').textContent = formatCurrency(todayTotal);
        document.getElementById('month-sales').textContent = formatCurrency(monthTotal);
        document.getElementById('best-selling').textContent = bestSelling;
        
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('today-sales').textContent = '₵0.00';
        document.getElementById('month-sales').textContent = '₵0.00';
        document.getElementById('best-selling').textContent = '-';
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
    
    // Add to cart automatically
    addToCart(medicine);
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
    } else {
        cartItems.push({
            id: medicine.id,
            name: medicine.name,
            price: medicine.price,
            quantity: 1
        });
    }
    
    medicineSearch.value = '';
    document.getElementById('medicine-search-results').style.display = 'none';
    updateCartDisplay();
    showSalesAlert(`${medicine.name} added to cart`);
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
    await refreshMedicines();
}

// Make functions available globally for inline event handlers
window.editMedicine = editMedicine;
window.deleteMedicine = deleteMedicine;

// Start the application
init();
