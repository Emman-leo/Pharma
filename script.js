// Initialize Supabase client
const supabaseUrl = 'https://idjbruyuhyyyoucivksj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkamJydXl1aHl5eW91Y2l2a3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc1MDksImV4cCI6MjA4NDYwMzUwOX0.uSxJidEC-S-z0ZMCMb2Bv14Q1EedgqKk4hTMx_EqHmU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const inventorySection = document.getElementById('inventorySection');
const salesSection = document.getElementById('salesSection');
const reportsSection = document.getElementById('reportsSection');
const inventoryBtn = document.getElementById('inventoryBtn');
const salesBtn = document.getElementById('salesBtn');
const reportsBtn = document.getElementById('reportsBtn');
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

// Current editing product ID
let currentEditProductId = null;

// Navigation
inventoryBtn.addEventListener('click', () => showSection('inventory'));
salesBtn.addEventListener('click', () => showSection('sales'));
reportsBtn.addEventListener('click', () => showSection('reports'));

function showSection(sectionName) {
    // Hide all sections
    inventorySection.classList.remove('active');
    salesSection.classList.remove('active');
    reportsSection.classList.remove('active');
    
    // Remove active class from all buttons
    inventoryBtn.classList.remove('active');
    salesBtn.classList.remove('active');
    reportsBtn.classList.remove('active');
    
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
    
    if (currentEditProductId) {
        // Update existing product
        const { error } = await supabase
            .from('products')
            .update({ name, price, quantity, category })
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
        const { error } = await supabase
            .from('products')
            .insert([{ name, price, quantity, category }]);
        
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
    const { data: product, error: productError } = await supabase
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
    const { error: saleError } = await supabase
        .from('sales')
        .insert([{
            product_id: productId,
            quantity_sold: quantitySold,
            total_price: totalPrice,
            customer_name: customer
        }]);
    
    if (saleError) {
        console.error('Error recording sale:', saleError);
        alert('Error recording sale');
        return;
    }
    
    // Update product quantity
    const newQuantity = product.quantity - quantitySold;
    const { error: updateError } = await supabase
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
    loadInventory();
    loadSales();
    loadReports();
});

// Load inventory data
async function loadInventory(searchTerm = '') {
    let query = supabase
        .from('products')
        .select('*')
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
        
        // Add low stock class if quantity is low
        const lowStockClass = product.quantity <= 5 ? 'low-stock' : '';
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td class="${lowStockClass}">${product.quantity}</td>
            <td>${product.category}</td>
            <td>
                <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        
        inventoryBody.appendChild(row);
    });
}

// Load sales data
async function loadSales() {
    const { data, error } = await supabase
        .from('sales')
        .select(`
            id,
            quantity_sold,
            total_price,
            sale_date,
            customer_name,
            products(name)
        `)
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
}

// Load products for sale dropdown
async function loadProductsForSale() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, quantity')
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
    // Load inventory stats
    const { count: totalProducts, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact' });
    
    if (!countError) {
        totalProductsEl.textContent = totalProducts || 0;
    }
    
    // Calculate total stock
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('products')
        .select('quantity');
    
    if (!inventoryError && inventoryData) {
        const totalStock = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
        totalStockEl.textContent = totalStock;
    }
    
    // Count low stock items
    const { count: lowStockCount, error: lowStockError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .lte('quantity', 5);
    
    if (!lowStockError) {
        lowStockCountEl.textContent = lowStockCount || 0;
    }
    
    // Calculate today's sales
    const today = new Date().toISOString().split('T')[0];
    const { data: dailySales, error: salesError } = await supabase
        .from('sales')
        .select('total_price')
        .gte('sale_date', `${today} 00:00:00`)
        .lte('sale_date', `${today} 23:59:59`);
    
    if (!salesError && dailySales) {
        const todaysTotal = dailySales.reduce((sum, sale) => sum + sale.total_price, 0);
        todaysSalesEl.textContent = `$${todaysTotal.toFixed(2)}`;
    }
    
    // Load low stock items
    const { data: lowStockItems, error: lowStockItemsError } = await supabase
        .from('products')
        .select('*')
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
            `;
            lowStockBody.appendChild(row);
        });
    }
}

// Edit product
async function editProduct(id) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
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
    cancelEditBtn.style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Delete product
async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
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
    cancelEditBtn.style.display = 'none';
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    loadInventory(e.target.value);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Show inventory section by default
    showSection('inventory');
    
    // Check if Supabase is configured properly
    if (supabaseUrl.includes('YOUR_PROJECT') || supabaseKey.includes('YOUR_ANON_KEY')) {
        alert('Please configure your Supabase credentials in script.js before using the application.');
    }
});