// Initialize Supabase client
const supabaseUrl = 'https://idjbruyuhyyyoucivksj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkamJydXl1aHl5eW91Y2l2a3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc1MDksImV4cCI6MjA4NDYwMzUwOX0.uSxJidEC-S-z0ZMCMb2Bv14Q1EedgqKk4hTMx_EqHmU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const pharmacySelect = document.getElementById('pharmacySelect');
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

// Current session data
let currentPharmacy = null;
let currentUser = null;
let currentEditProductId = null;

// Load pharmacies for the dropdown
async function loadPharmacies() {
    try {
        const { data, error } = await supabaseClient
            .from('pharmacies')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        
        if (error) {
            console.error('Error loading pharmacies:', error);
            return;
        }
        
        // Clear existing options except the first one
        pharmacySelect.innerHTML = '<option value="">Choose your pharmacy</option>';
        
        // Add pharmacies to the dropdown
        if (data && data.length > 0) {
            data.forEach(pharmacy => {
                const option = document.createElement('option');
                option.value = pharmacy.id;
                option.textContent = pharmacy.name;
                pharmacySelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No pharmacies available';
            pharmacySelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error in loadPharmacies:', error);
    }
}

// Login event
loginBtn.addEventListener('click', async () => {
    const selectedPharmacyId = pharmacySelect.value;
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!selectedPharmacyId || !username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Verify the user credentials against the database
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select(`
                id,
                username,
                role,
                pharmacies(name)
            `)
            .eq('pharmacy_id', selectedPharmacyId)
            .eq('username', username)
            .eq('is_active', true)
            .single();
        
        if (userError) {
            console.error('Authentication error:', userError);
            alert('Invalid credentials. Please check your username and password.');
            return;
        }

        // For this simplified implementation, we'll verify the password
        // In a real application, passwords should be hashed and compared securely
        if (password !== user.password_hash) {
            alert('Invalid password. Please check your credentials.');
            return;
        }
        
        // Get pharmacy details
        const { data: pharmacy, error: pharmacyError } = await supabaseClient
            .from('pharmacies')
            .select('name')
            .eq('id', selectedPharmacyId)
            .single();
        
        if (pharmacyError) {
            console.error('Error fetching pharmacy:', pharmacyError);
            alert('Invalid pharmacy selected');
            return;
        }
        
        // Set current session
        currentPharmacy = {
            id: selectedPharmacyId,
            name: pharmacy.name
        };
        currentUser = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        
        // Update UI
        currentUserDisplay.textContent = currentUser.username;
        currentPharmacyDisplay.textContent = currentPharmacy.name;
        dashboardTitle.textContent = `${currentPharmacy.name} Dashboard`;
        
        // Switch to main app
        welcomeScreen.classList.remove('active');
        mainApp.classList.add('active');
        
        // Load inventory
        await loadInventory();
    } catch (error) {
        console.error('Login error:', error);
        alert('Authentication failed. Please check your credentials.');
    }
});

// Logout event
logoutBtn.addEventListener('click', () => {
    // Clear session data
    currentPharmacy = null;
    currentUser = null;
    
    // Reset form
    pharmacySelect.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    
    // Switch back to welcome screen
    mainApp.classList.remove('active');
    welcomeScreen.classList.add('active');
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Navigation
inventoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('inventory');
});
salesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('sales');
});
reportsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('reports');
});
settingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Settings functionality coming soon!');
});

function showSection(sectionName) {
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

// Form handling
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const category = document.getElementById('productCategory').value;
    
    // Add pharmacy ID to the data (using pharmacy name as identifier for now)
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
            .eq('id', currentEditProductId)
            .eq('pharmacy_id', currentPharmacy.id); // Ensure we only update products from this pharmacy
        
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
    
    // Get product details (ensuring it belongs to current pharmacy)
    const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('pharmacy_id', currentPharmacy.id)
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
        .eq('id', productId)
        .eq('pharmacy_id', currentPharmacy.id);
    
    if (updateError) {
        console.error('Error updating product quantity:', updateError);
        alert('Error updating product quantity');
        return;
    }
    
    alert('Sale recorded successfully!');
    saleForm.reset();
    loadInventory();
    loadSales();
    loadReports();
});

// Load inventory data
async function loadInventory(searchTerm = '') {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
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

// Load sales data
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

// Load products for sale dropdown
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

// Load report data
async function loadReports() {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
        return;
    }
    
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
    
    // Calculate today's sales for current pharmacy
    const today = new Date().toISOString().split('T')[0];
    const { data: dailySales, error: salesError } = await supabaseClient
        .from('sales')
        .select('total_price')
        .eq('pharmacy_id', currentPharmacy.id)
        .gte('sale_date', `${today} 00:00:00`)
        .lte('sale_date', `${today} 23:59:59`);
    
    if (!salesError && dailySales) {
        const todaysTotal = dailySales.reduce((sum, sale) => sum + sale.total_price, 0);
        todaysSalesEl.textContent = `$${todaysTotal.toFixed(2)}`;
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
}

// Edit product
async function editProduct(id) {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
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

// Delete product
async function deleteProduct(id) {
    if (!currentPharmacy) {
        console.log('No pharmacy selected');
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
    loadInventory(e.target.value);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Initially show the welcome screen
    welcomeScreen.classList.add('active');
    mainApp.classList.remove('active');
    
    // Load pharmacies for the dropdown
    await loadPharmacies();
    
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