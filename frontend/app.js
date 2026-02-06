// REPLACE_WITH_API_GATEWAY_URL
const API_BASE_URL = 'https://replace-me.execute-api.us-east-1.amazonaws.com/prod';

// State
let employees = [];
let isEditing = false;
let currentEmployeeId = null;

// DOM Elements
const employeeGrid = document.getElementById('employee-grid');
const loadingSpinner = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
const employeeForm = document.getElementById('employeeForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const btnSpinner = document.getElementById('btnSpinner');
const btnText = document.getElementById('btnText');
const liveToast = new bootstrap.Toast(document.getElementById('liveToast'));
const toastMessage = document.getElementById('toastMessage');

// Initial Load
document.addEventListener('DOMContentLoaded', fetchEmployees);

// --- API Calls ---

async function fetchEmployees() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/employees`); // Maps to listEmployees lambda
        if (!response.ok) throw new Error('Failed to fetch employees');
        const data = await response.json();
        // Adjust based on if data is wrapped in "Items" or just array
        employees = data.Items || data; 
        renderEmployees();
    } catch (error) {
        console.error(error);
        showToast('Error loading employees', true);
    } finally {
        showLoading(false);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    setLoadingButton(true);

    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const email = document.getElementById('email').value;
    const photoInput = document.getElementById('photo');
    const file = photoInput.files[0];

    try {
        let photoUrl = isEditing 
            ? employees.find(e => e.id === currentEmployeeId).photoUrl 
            : 'https://via.placeholder.com/300'; // Default

        // 1. Handle File Upload if present
        if (file) {
            // Get Presigned URL
            // We reuse the create/update endpoint to get the URL first
            // Pattern: POST to /employees with action='getUploadUrl' (handled by CreateEmployee)
            const uploadRes = await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'getUploadUrl', 
                    contentType: file.type,
                    fileName: file.name
                })
            });
            
            if (!uploadRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, key, publicUrl } = await uploadRes.json();

            // Upload directly to S3
            await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            photoUrl = publicUrl;
        }

        // 2. Create or Update Employee Record
        const employeeData = { name, role, email, photoUrl };

        if (isEditing) {
            // PUT /employees/{id}
            await fetch(`${API_BASE_URL}/employees/${currentEmployeeId}`, {
                method: 'PUT',
                body: JSON.stringify(employeeData)
            });
            showToast('Employee updated successfully');
        } else {
            // POST /employees
             await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                body: JSON.stringify(employeeData) // Without 'action', it treats as create
            });
            showToast('Employee created successfully');
        }

        employeeModal.hide();
        fetchEmployees();
    } catch (error) {
        console.error(error);
        showToast('Operation failed: ' + error.message, true);
    } finally {
        setLoadingButton(false);
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Delete failed');
        
        showToast('Employee deleted');
        fetchEmployees();
    } catch (error) {
        console.error(error);
        showToast('Could not delete employee', true);
    }
}

// --- UI Functions ---

function renderEmployees() {
    employeeGrid.innerHTML = '';
    
    if (employees.length === 0) {
        emptyState.style.display = 'block';
        employeeGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    employeeGrid.style.display = 'flex';

    employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 col-lg-4 animate-fade-in';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-img-top-container">
                    <img src="${emp.photoUrl || 'https://via.placeholder.com/300'}" class="card-img-top" alt="${emp.name}">
                </div>
                <div class="card-body position-relative">
                    <div class="position-absolute top-0 end-0 p-3 d-flex gap-2">
                        <button class="btn btn-action btn-edit shadow-sm" onclick="editEmployee('${emp.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-action btn-delete shadow-sm" onclick="deleteEmployee('${emp.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <h5 class="card-title mt-2">${emp.name}</h5>
                    <div class="card-subtitle">${emp.role}</div>
                    <p class="card-text text-truncate"><i class="far fa-envelope me-2"></i>${emp.email}</p>
                </div>
            </div>
        `;
        employeeGrid.appendChild(card);
    });
}

function resetForm() {
    isEditing = false;
    currentEmployeeId = null;
    modalTitle.innerText = 'Add Employee';
    btnText.innerText = 'Save Employee';
    document.getElementById('name').value = '';
    document.getElementById('role').value = '';
    document.getElementById('email').value = '';
    document.getElementById('photo').value = '';
    document.getElementById('currentPhotoContainer').classList.add('d-none');
}

function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    isEditing = true;
    currentEmployeeId = id;
    
    modalTitle.innerText = 'Edit Employee';
    btnText.innerText = 'Update Employee';
    
    document.getElementById('name').value = emp.name;
    document.getElementById('role').value = emp.role;
    document.getElementById('email').value = emp.email;
    
    const photoContainer = document.getElementById('currentPhotoContainer');
    const photoImg = document.getElementById('currentPhoto');
    if (emp.photoUrl) {
        photoContainer.classList.remove('d-none');
        photoImg.src = emp.photoUrl;
    } else {
        photoContainer.classList.add('d-none');
    }

    employeeModal.show();
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.style.display = 'block';
        employeeGrid.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        // renderEmployees will handle showing grid/empty
    }
}

function setLoadingButton(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        btnSpinner.classList.remove('d-none');
        btnText.innerText = 'Processing...';
    } else {
        btnSpinner.classList.add('d-none');
        btnText.innerText = isEditing ? 'Update Employee' : 'Save Employee';
    }
}

function showToast(message, isError = false) {
    toastMessage.innerText = message;
    const toastEl = document.getElementById('liveToast');
    if (isError) {
        toastEl.classList.remove('bg-primary');
        toastEl.classList.add('bg-danger');
    } else {
        toastEl.classList.remove('bg-danger');
        toastEl.classList.add('bg-primary');
    }
    liveToast.show();
}

employeeForm.addEventListener('submit', handleFormSubmit);
