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

// Display user email
if (userEmail) {
    userEmail.textContent = user.email;
}

// Global variables
let medicines = [];
let filteredMedicines = [];

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

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
