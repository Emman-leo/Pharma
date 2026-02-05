import { supabase } from './supabase.js';

const medicineTableBody = document.querySelector('tbody');
const addMedicineForm = document.getElementById('add-medicine-form');

async function getMedicines() {
    const { data, error } = await supabase
        .from('medicines')
        .select('*');

    if (error) {
        console.error('Error fetching medicines:', error);
        return;
    }

    medicineTableBody.innerHTML = ''; // Clear the table
    for (const medicine of data) {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = medicine.name;
        row.appendChild(nameCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = medicine.quantity;
        row.appendChild(quantityCell);

        const priceCell = document.createElement('td');
        priceCell.textContent = medicine.price;
        row.appendChild(priceCell);

        medicineTableBody.appendChild(row);
    }
}

async function addMedicine(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;

    const { error } = await supabase
        .from('medicines')
        .insert([{ name, quantity, price }]);

    if (error) {
        console.error('Error adding medicine:', error);
    } else {
        addMedicineForm.reset(); // Clear the form
        getMedicines(); // Refresh the table
    }
}

addMedicineForm.addEventListener('submit', addMedicine);

getMedicines();
