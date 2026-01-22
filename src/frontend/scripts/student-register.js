/**
 * EduPhysics Academy - Public Student Registration
 * Handles student self-registration with payment receipt upload
 */

// DOM Elements
const registrationForm = document.getElementById('studentRegistrationForm');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const errorText = document.getElementById('errorText');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('paymentReceipt');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const pdfIcon = document.getElementById('pdfIcon');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');

// State
let selectedFile = null;
let fileBase64 = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    initializeClassSelection();
    initializeFileUpload();
    initializeAlerts();
    initializeMobileNav();
});

// Mobile Navigation
function initializeMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Initialize form
function initializeForm() {
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
}

// Class selection with fee calculation
function initializeClassSelection() {
    const classCheckboxes = document.querySelectorAll('input[name="classes"]');
    const feeSelect = document.getElementById('registrationFee');

    classCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateFeeSummary);
    });

    if (feeSelect) {
        feeSelect.addEventListener('change', updateFeeSummary);
    }
}

function updateFeeSummary() {
    const classCheckboxes = document.querySelectorAll('input[name="classes"]:checked');
    const feeSelect = document.getElementById('registrationFee');
    const selectedClassesText = document.getElementById('selectedClassesText');
    const classCount = document.getElementById('classCount');
    const totalFee = document.getElementById('totalFee');

    const selectedClasses = Array.from(classCheckboxes).map(cb => {
        const label = cb.value.replace('-', ' ');
        return label.charAt(0).toUpperCase() + label.slice(1);
    });

    selectedClassesText.textContent = selectedClasses.length > 0
        ? selectedClasses.join(', ')
        : 'None selected';
    classCount.textContent = selectedClasses.length;

    if (selectedClasses.length > 0 && feeSelect) {
        const suggestedFee = selectedClasses.length * 1000;
        feeSelect.value = suggestedFee.toString();
    }

    const fee = feeSelect ? parseInt(feeSelect.value) || 0 : 0;
    totalFee.textContent = `Rs. ${fee.toLocaleString()}`;
}

// File Upload Handling
function initializeFileUpload() {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Remove file
    removeFileBtn.addEventListener('click', removeFile);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Please upload JPG, PNG, or PDF files only.');
        return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File is too large. Maximum size is 5MB.');
        return;
    }

    selectedFile = file;

    // Show preview
    uploadArea.classList.add('hidden');
    filePreview.classList.remove('hidden');

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    if (file.type.startsWith('image/')) {
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.classList.remove('hidden');
            pdfIcon.classList.add('hidden');
            fileBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Show PDF icon
        previewImage.classList.add('hidden');
        pdfIcon.classList.remove('hidden');

        // Convert PDF to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            fileBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeFile() {
    selectedFile = null;
    fileBase64 = null;
    fileInput.value = '';

    uploadArea.classList.remove('hidden');
    filePreview.classList.add('hidden');
    previewImage.classList.add('hidden');
    pdfIcon.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Initialize alerts
function initializeAlerts() {
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.alert').classList.add('hidden');
        });
    });
}

// Handle form submission
async function handleRegistration(e) {
    e.preventDefault();

    clearErrors();

    if (!validateForm()) {
        return;
    }

    const formData = getFormData();
    const submitBtn = registrationForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Show loading
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        // Try API first
        const response = await api.createStudentRegistration(formData);

        if (response.success) {
            showSuccess();
            registrationForm.reset();
            removeFile();
            updateFeeSummary();
        }
    } catch (error) {
        // Fallback to localStorage if API fails
        console.warn('API unavailable, using localStorage:', error.message);

        if (saveStudentLocally(formData)) {
            showSuccess();
            registrationForm.reset();
            removeFile();
            updateFeeSummary();
        } else {
            showError(error.message || 'Failed to submit registration');
        }
    } finally {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Get form data
function getFormData() {
    const classCheckboxes = document.querySelectorAll('input[name="classes"]:checked');
    const genderRadio = document.querySelector('input[name="gender"]:checked');

    return {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        mobile: document.getElementById('mobile').value.trim(),
        gender: genderRadio ? genderRadio.value : '',
        address: document.getElementById('address').value.trim(),
        classes: Array.from(classCheckboxes).map(cb => cb.value),
        registerDate: new Date().toISOString().split('T')[0],
        registrationFee: parseInt(document.getElementById('registrationFee').value),
        paymentReceipt: fileBase64,
        paymentReceiptName: selectedFile ? selectedFile.name : '',
        registrationType: 'online',
        status: 'pending', // Pending until admin verifies payment
        createdAt: new Date().toISOString()
    };
}

// Validate form
function validateForm() {
    let isValid = true;

    const firstName = document.getElementById('firstName').value.trim();
    if (!firstName || firstName.length < 2) {
        showFieldError('firstNameError', 'First name must be at least 2 characters');
        isValid = false;
    }

    const lastName = document.getElementById('lastName').value.trim();
    if (!lastName || lastName.length < 2) {
        showFieldError('lastNameError', 'Last name must be at least 2 characters');
        isValid = false;
    }

    const email = document.getElementById('email').value.trim();
    if (!email || !isValidEmail(email)) {
        showFieldError('emailError', 'Please enter a valid email address');
        isValid = false;
    }

    const mobile = document.getElementById('mobile').value.trim();
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
        showFieldError('mobileError', 'Please enter a valid mobile number');
        isValid = false;
    }

    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (!genderRadio) {
        showFieldError('genderError', 'Please select a gender');
        isValid = false;
    }

    const address = document.getElementById('address').value.trim();
    if (!address || address.length < 5) {
        showFieldError('addressError', 'Address must be at least 5 characters');
        isValid = false;
    }

    const classCheckboxes = document.querySelectorAll('input[name="classes"]:checked');
    if (classCheckboxes.length === 0) {
        showFieldError('classesError', 'Please select at least one class');
        isValid = false;
    }

    const registrationFee = document.getElementById('registrationFee').value;
    if (!registrationFee) {
        showFieldError('registrationFeeError', 'Please select a registration fee');
        isValid = false;
    }

    // Payment receipt is required for online registration
    if (!selectedFile) {
        showFieldError('paymentReceiptError', 'Please upload your payment receipt');
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
    });
}

// LocalStorage fallback
function saveStudentLocally(student) {
    try {
        const students = JSON.parse(localStorage.getItem('eduphysics_students') || '[]');

        // Check email exists
        if (students.some(s => s.email === student.email)) {
            throw new Error('Email already registered');
        }

        student.id = 'STU-' + Date.now().toString(36).toUpperCase();
        students.push(student);
        localStorage.setItem('eduphysics_students', JSON.stringify(students));
        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

// Alert functions
function showSuccess() {
    if (successAlert) {
        successAlert.classList.remove('hidden');
        setTimeout(() => successAlert.classList.add('hidden'), 10000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showError(message) {
    if (errorAlert && errorText) {
        errorText.textContent = message;
        errorAlert.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
