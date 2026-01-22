/**
 * EduPhysics Academy - Student Management
 * Handles displaying, searching, filtering, editing, and deleting students
 */

const STUDENTS_KEY = 'eduphysics_students';
let currentPage = 1;
const itemsPerPage = 10;
let filteredStudents = [];
let deleteStudentId = null;

// DOM Elements
const studentTableBody = document.getElementById('studentTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const genderFilter = document.getElementById('genderFilter');
const classFilter = document.getElementById('classFilter');
const monthFilter = document.getElementById('monthFilter');
const pagination = document.getElementById('pagination');

// Modals
const viewModal = document.getElementById('viewModal');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    initializeSearch();
    initializeFilters();
    initializeModals();
    updateAnalytics();
});

// Load and display students
function loadStudents() {
    showLoading(true);

    setTimeout(() => {
        const students = getStudents();
        filteredStudents = [...students];
        renderStudents();
        updateAnalytics();
        showLoading(false);
    }, 300);
}

function getStudents() {
    const data = localStorage.getItem(STUDENTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveStudents(students) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

// Render students table
function renderStudents() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        pagination.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    pagination.classList.remove('hidden');

    studentTableBody.innerHTML = paginatedStudents.map((student, index) => {
        const isPending = student.registrationType === 'online' && student.status === 'pending';
        const pendingIndicator = isPending ? '<span class="pending-dot" title="Pending Verification"></span>' : '';
        const rowClass = isPending ? 'pending-row' : '';

        return `
        <tr data-id="${student.id}" class="${rowClass}">
            <td>${startIndex + index + 1}${pendingIndicator}</td>
            <td>
                <div class="student-name">${student.firstName} ${student.lastName}</div>
                <div class="student-email">${student.email}</div>
            </td>
            <td>${student.mobile}</td>
            <td>
                <span class="gender-badge ${student.gender}">
                    ${student.gender === 'male' ? '👨' : '👩'} ${capitalizeFirst(student.gender)}
                </span>
            </td>
            <td>${renderClassBadges(student.classes)}</td>
            <td>${formatDate(student.registerDate)}</td>
            <td>Rs. ${student.registrationFee.toLocaleString()}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view ${isPending ? 'pending-action' : ''}" onclick="viewStudent('${student.id}')" title="${isPending ? 'Review & Verify' : 'View Details'}">${isPending ? '⏳' : '👁️'}</button>
                    <button class="action-btn edit" onclick="editStudent('${student.id}')" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="confirmDelete('${student.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    renderPagination();
}

function renderClassBadges(classes) {
    if (!classes || classes.length === 0) return '-';
    return classes.map(c => {
        const displayName = c === 'combined-maths' ? 'C.Maths' : capitalizeFirst(c);
        return `<span class="class-badge ${c}">${displayName}</span>`;
    }).join(' ');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderStudents(); } };
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderStudents(); } };

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesHtml += `<button class="page-num ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHtml += `<span class="page-num">...</span>`;
        }
    }
    pageNumbers.innerHTML = pagesHtml;
}

function goToPage(page) {
    currentPage = page;
    renderStudents();
}

// Search functionality
function initializeSearch() {
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.add('hidden');
            applyFilters();
        });
    }
}

function handleSearch() {
    if (searchInput.value.trim()) {
        searchClear.classList.remove('hidden');
    } else {
        searchClear.classList.add('hidden');
    }
    applyFilters();
}

// Filter functionality
function initializeFilters() {
    if (genderFilter) genderFilter.addEventListener('change', applyFilters);
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (monthFilter) monthFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const students = getStudents();
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const genderValue = genderFilter ? genderFilter.value : '';
    const classValue = classFilter ? classFilter.value : '';
    const monthValue = monthFilter ? monthFilter.value : '';

    filteredStudents = students.filter(student => {
        // Search filter
        const matchesSearch = !searchTerm ||
            student.firstName.toLowerCase().includes(searchTerm) ||
            student.lastName.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.mobile.includes(searchTerm);

        // Gender filter
        const matchesGender = !genderValue || student.gender === genderValue;

        // Class filter
        const matchesClass = !classValue || (student.classes && student.classes.includes(classValue));

        // Month filter
        const matchesMonth = !monthValue || student.registerDate.startsWith(monthValue);

        return matchesSearch && matchesGender && matchesClass && matchesMonth;
    });

    currentPage = 1;
    renderStudents();
    updateAnalytics();
}

// Analytics
function updateAnalytics() {
    const students = getStudents();

    // Total students
    document.getElementById('totalStudents').textContent = students.length;

    // Gender distribution
    const males = students.filter(s => s.gender === 'male').length;
    const females = students.filter(s => s.gender === 'female').length;
    document.getElementById('maleCount').textContent = males;
    document.getElementById('femaleCount').textContent = females;

    const total = males + females;
    const malePercent = total > 0 ? (males / total) * 100 : 50;
    const femalePercent = total > 0 ? (females / total) * 100 : 50;
    document.getElementById('maleBar').style.width = `${malePercent}%`;
    document.getElementById('femaleBar').style.width = `${femalePercent}%`;

    // Class distribution
    const physicsCount = students.filter(s => s.classes && s.classes.includes('physics')).length;
    const chemistryCount = students.filter(s => s.classes && s.classes.includes('chemistry')).length;
    const mathsCount = students.filter(s => s.classes && s.classes.includes('combined-maths')).length;
    document.getElementById('physicsCount').textContent = physicsCount;
    document.getElementById('chemistryCount').textContent = chemistryCount;
    document.getElementById('mathsCount').textContent = mathsCount;

    // Recent registrations
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekCount = students.filter(s => new Date(s.registerDate) >= weekAgo).length;
    const monthCount = students.filter(s => new Date(s.registerDate) >= monthStart).length;
    document.getElementById('weekCount').textContent = weekCount;
    document.getElementById('monthCount').textContent = monthCount;

    // Pending verification count
    updatePendingVerificationBadge(students);
}

// Update pending verification badge
function updatePendingVerificationBadge(students) {
    const pendingCount = students.filter(s =>
        s.registrationType === 'online' && s.status === 'pending'
    ).length;

    const pendingBadge = document.getElementById('pendingBadge');
    const pendingCountEl = document.getElementById('pendingVerificationCount');

    if (pendingCount > 0) {
        pendingBadge.classList.remove('hidden');
        pendingCountEl.textContent = pendingCount;
    } else {
        pendingBadge.classList.add('hidden');
    }
}

// Modal functions
function initializeModals() {
    // View modal
    document.getElementById('viewModalClose').addEventListener('click', () => closeModal(viewModal));

    // Edit modal
    document.getElementById('editModalClose').addEventListener('click', () => closeModal(editModal));
    document.getElementById('editCancelBtn').addEventListener('click', () => closeModal(editModal));
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);

    // Delete modal
    document.getElementById('deleteCancelBtn').addEventListener('click', () => closeModal(deleteModal));
    document.getElementById('deleteConfirmBtn').addEventListener('click', handleDelete);

    // Close on overlay click
    [viewModal, editModal, deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
}

function openModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.add('hidden');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// View student
let currentViewStudentId = null;

function viewStudent(id) {
    const students = getStudents();
    const student = students.find(s => s.id === id);
    if (!student) return;

    currentViewStudentId = id;
    const isOnline = student.registrationType === 'online';
    const status = student.status || 'verified';
    const statusLabel = status === 'pending' ? '⏳ Pending Verification' :
        status === 'verified' ? '✅ Verified' : '❌ Rejected';
    const statusClass = status;

    const detailsHtml = `
        <div class="detail-row"><span class="detail-label">Student ID</span><span class="detail-value">${student.id}</span></div>
        <div class="detail-row"><span class="detail-label">Full Name</span><span class="detail-value">${student.firstName} ${student.lastName}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${student.email}</span></div>
        <div class="detail-row"><span class="detail-label">Mobile</span><span class="detail-value">${student.mobile}</span></div>
        <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${capitalizeFirst(student.gender)}</span></div>
        <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${student.address}</span></div>
        <div class="detail-row"><span class="detail-label">Classes</span><span class="detail-value">${renderClassBadges(student.classes)}</span></div>
        <div class="detail-row"><span class="detail-label">Reg. Date</span><span class="detail-value">${formatDate(student.registerDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Fee Paid</span><span class="detail-value">Rs. ${student.registrationFee.toLocaleString()}</span></div>
        <div class="detail-row">
            <span class="detail-label">Registration Type</span>
            <span class="detail-value">
                ${isOnline ? '<span class="type-badge online">🌐 Online (Bank Transfer)</span>' : '<span class="type-badge manual">📝 Manual (Local Payment)</span>'}
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge ${statusClass}">${statusLabel}</span></span>
        </div>
        <div class="detail-row"><span class="detail-label">Registered On</span><span class="detail-value">${formatDateTime(student.createdAt)}</span></div>
    `;
    document.getElementById('studentDetails').innerHTML = detailsHtml;

    // Handle receipt section
    const receiptSection = document.getElementById('receiptSection');
    const receiptPreview = document.getElementById('receiptPreview');

    if (isOnline && student.paymentReceipt) {
        receiptSection.classList.remove('hidden');

        // Check if PDF or image
        if (student.paymentReceipt.startsWith('data:application/pdf')) {
            receiptPreview.innerHTML = `
                <a href="${student.paymentReceipt}" target="_blank" class="pdf-link btn btn-secondary">
                    <span>📄</span> View PDF Receipt
                </a>
                <p class="receipt-name">${student.paymentReceiptName || 'receipt.pdf'}</p>
            `;
        } else {
            receiptPreview.innerHTML = `
                <img src="${student.paymentReceipt}" alt="Payment Receipt" onclick="window.open(this.src, '_blank')">
                <p class="receipt-name">${student.paymentReceiptName || 'receipt.jpg'}</p>
            `;
        }
    } else {
        receiptSection.classList.add('hidden');
        receiptPreview.innerHTML = '';
    }

    // Handle verification actions
    const verificationActions = document.getElementById('verificationActions');

    if (isOnline && status === 'pending') {
        verificationActions.classList.remove('hidden');

        // Set up verify button
        document.getElementById('verifyBtn').onclick = () => verifyStudent(id, 'verified');
        document.getElementById('rejectBtn').onclick = () => verifyStudent(id, 'rejected');
    } else {
        verificationActions.classList.add('hidden');
    }

    openModal(viewModal);
}

// Verify or reject student
function verifyStudent(id, status) {
    const students = getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return;

    students[index].status = status;
    students[index].updatedAt = new Date().toISOString();
    saveStudents(students);

    closeModal(viewModal);
    loadStudents();

    // Show notification
    alert(`Student registration ${status === 'verified' ? 'approved' : 'rejected'} successfully!`);
}

// Edit student
function editStudent(id) {
    const students = getStudents();
    const student = students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editFirstName').value = student.firstName;
    document.getElementById('editLastName').value = student.lastName;
    document.getElementById('editEmail').value = student.email;
    document.getElementById('editMobile').value = student.mobile;
    document.getElementById('editAddress').value = student.address;
    document.getElementById('editRegisterDate').value = student.registerDate;
    document.getElementById('editFee').value = student.registrationFee;

    // Set gender
    const genderRadio = document.querySelector(`input[name="editGender"][value="${student.gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    // Set classes
    document.querySelectorAll('input[name="editClasses"]').forEach(cb => {
        cb.checked = student.classes && student.classes.includes(cb.value);
    });

    openModal(editModal);
}

function handleEditSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('editStudentId').value;
    const students = getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return;

    const genderRadio = document.querySelector('input[name="editGender"]:checked');
    const classCheckboxes = document.querySelectorAll('input[name="editClasses"]:checked');

    students[index] = {
        ...students[index],
        firstName: document.getElementById('editFirstName').value.trim(),
        lastName: document.getElementById('editLastName').value.trim(),
        email: document.getElementById('editEmail').value.trim().toLowerCase(),
        mobile: document.getElementById('editMobile').value.trim(),
        gender: genderRadio ? genderRadio.value : students[index].gender,
        address: document.getElementById('editAddress').value.trim(),
        classes: Array.from(classCheckboxes).map(cb => cb.value),
        registerDate: document.getElementById('editRegisterDate').value,
        registrationFee: parseInt(document.getElementById('editFee').value),
        updatedAt: new Date().toISOString()
    };

    saveStudents(students);
    closeModal(editModal);
    loadStudents();
}

// Delete student
function confirmDelete(id) {
    const students = getStudents();
    const student = students.find(s => s.id === id);
    if (!student) return;

    deleteStudentId = id;
    document.getElementById('deleteStudentName').textContent = `${student.firstName} ${student.lastName}`;
    openModal(deleteModal);
}

function handleDelete() {
    if (!deleteStudentId) return;

    const students = getStudents();
    const updatedStudents = students.filter(s => s.id !== deleteStudentId);
    saveStudents(updatedStudents);

    deleteStudentId = null;
    closeModal(deleteModal);
    loadStudents();
}

// Utility functions
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        studentTableBody.innerHTML = '';
    } else {
        loadingState.classList.add('hidden');
    }
}

function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========== Delete All Feature ==========
const deleteAllModal = document.getElementById('deleteAllModal');

function initializeDeleteAll() {
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const deleteAllModalClose = document.getElementById('deleteAllModalClose');
    const cancelDeleteAll = document.getElementById('cancelDeleteAll');
    const confirmDeleteAll = document.getElementById('confirmDeleteAll');
    const confirmDeleteCheckbox = document.getElementById('confirmDeleteCheckbox');
    const downloadDataBtn = document.getElementById('downloadDataBtn');

    // Open delete all modal
    deleteAllBtn.addEventListener('click', openDeleteAllModal);

    // Close modal
    deleteAllModalClose.addEventListener('click', () => closeModal(deleteAllModal));
    cancelDeleteAll.addEventListener('click', () => closeModal(deleteAllModal));

    // Enable/disable confirm button based on checkbox
    confirmDeleteCheckbox.addEventListener('change', (e) => {
        confirmDeleteAll.disabled = !e.target.checked;
    });

    // Download data
    downloadDataBtn.addEventListener('click', downloadAllData);

    // Confirm delete
    confirmDeleteAll.addEventListener('click', executeDeleteAll);
}

function openDeleteAllModal() {
    const students = getStudents();
    const summaryBox = document.getElementById('deleteDataSummary');

    // Calculate summary
    const totalStudents = students.length;
    const totalRevenue = students.reduce((sum, s) => sum + (s.registrationFee || 0), 0);
    const physicCount = students.filter(s => s.classes && s.classes.includes('physics')).length;
    const chemCount = students.filter(s => s.classes && s.classes.includes('chemistry')).length;
    const mathsCount = students.filter(s => s.classes && s.classes.includes('combined-maths')).length;

    summaryBox.innerHTML = `
        <h4>📊 Data Summary to be Deleted</h4>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Total Students</span>
                <span class="summary-value">${totalStudents}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Revenue</span>
                <span class="summary-value">Rs. ${totalRevenue.toLocaleString()}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Physics</span>
                <span class="summary-value">${physicCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Chemistry</span>
                <span class="summary-value">${chemCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Combined Maths</span>
                <span class="summary-value">${mathsCount}</span>
            </div>
        </div>
    `;

    // Reset checkbox and button
    document.getElementById('confirmDeleteCheckbox').checked = false;
    document.getElementById('confirmDeleteAll').disabled = true;

    openModal(deleteAllModal);
}

function downloadAllData() {
    const students = getStudents();

    if (students.length === 0) {
        alert('No data to download!');
        return;
    }

    // Create CSV content
    const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Mobile', 'Gender',
        'Address', 'Classes', 'Registration Date', 'Registration Fee',
        'Registration Type', 'Status', 'Created At'
    ];

    const rows = students.map(s => [
        s.id,
        s.firstName,
        s.lastName,
        s.email,
        s.mobile,
        s.gender,
        `"${(s.address || '').replace(/"/g, '""')}"`,
        (s.classes || []).join('; '),
        s.registerDate,
        s.registrationFee,
        s.registrationType || 'manual',
        s.status || 'verified',
        s.createdAt
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `eduphysics_students_backup_${date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Show success message
    alert(`Downloaded ${students.length} student records to CSV file.`);
}

function executeDeleteAll() {
    const students = getStudents();
    const count = students.length;

    // Clear all student data
    localStorage.removeItem('eduphysics_students');

    // Close modal
    closeModal(deleteAllModal);

    // Reload page
    alert(`Successfully deleted ${count} student records. The page will now reload.`);
    location.reload();
}

// Initialize Delete All feature when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDeleteAll);