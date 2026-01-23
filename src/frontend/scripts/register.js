/**
 * EduPhysics Academy - Student Registration
 * Handles student registration with API integration
 */

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const errorText = document.getElementById('errorText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    initializeClassSelection();
    initializeAlerts();
    setDefaultDate();
});

// Set default registration date to today
function setDefaultDate() {
    const dateInput = document.getElementById('registerDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

// Initialize form handling
function initializeForm() {
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
        registrationForm.addEventListener('reset', resetFeeSummary);
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

function resetFeeSummary() {
    setTimeout(() => {
        document.getElementById('selectedClassesText').textContent = 'None selected';
        document.getElementById('classCount').textContent = '0';
        document.getElementById('totalFee').textContent = 'Rs. 0';
    }, 0);
}

// Initialize alerts
function initializeAlerts() {
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.alert').classList.add('hidden');
        });
    });
}

// Handle form submission - NOW USES MONGODB API ONLY
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
        // Use API to save to MongoDB
        const response = await api.createStudent(formData);

        if (response.success) {
            showSuccess('Student registered successfully! Data saved to database.');
            registrationForm.reset();
            resetFeeSummary();
            setDefaultDate();
        } else {
            throw new Error(response.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Show user-friendly error message
        let errorMessage = error.message || 'Failed to register student';
        if (errorMessage.includes('Email already registered')) {
            errorMessage = 'This email is already registered. Please use a different email.';
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        }

        showError(errorMessage);
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
        registerDate: document.getElementById('registerDate').value,
        registrationFee: parseInt(document.getElementById('registrationFee').value)
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

    const registerDate = document.getElementById('registerDate').value;
    if (!registerDate) {
        showFieldError('registerDateError', 'Please select a registration date');
        isValid = false;
    }

    const registrationFee = document.getElementById('registrationFee').value;
    if (!registrationFee) {
        showFieldError('registrationFeeError', 'Please select a registration fee');
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
        student.createdAt = new Date().toISOString();
        students.push(student);
        localStorage.setItem('eduphysics_students', JSON.stringify(students));
        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

// Alert functions
function showSuccess(message) {
    if (successAlert) {
        successAlert.querySelector('.alert-text').textContent = message;
        successAlert.classList.remove('hidden');
        setTimeout(() => successAlert.classList.add('hidden'), 5000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showError(message) {
    if (errorAlert) {
        errorText.textContent = message;
        errorAlert.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}