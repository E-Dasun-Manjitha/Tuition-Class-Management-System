/**
 * EduPhysics Academy - Finance Analysis
 * Handles financial data analysis, charts, and reporting
 * NOW USES MONGODB BACKEND API FOR REAL-TIME DATA SYNC
 */

// Global data store
let allStudents = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFinanceData();
    initializeFilters();
    initializeExport();

    // Auto-refresh data every 30 seconds for real-time updates
    setInterval(loadFinanceData, 30000);
});

// ==================== API FUNCTIONS ====================

// Load financial data from MongoDB via API
async function loadFinanceData() {
    try {
        const response = await api.getStudents();

        if (response.success) {
            allStudents = response.data || [];

            // Filter to get only verified or admin-added students for financial calculations
            const verifiedStudents = getVerifiedStudents(allStudents);

            updateOverviewCards(verifiedStudents);
            updateClassRevenue(verifiedStudents);
            updatePaymentTypeAnalytics(allStudents); // Pass all students for payment type breakdown
            updateMonthlyChart(verifiedStudents);
            updateFeeDistribution(verifiedStudents);
            updateTransactionsTable(verifiedStudents);
        } else {
            console.error('Failed to load finance data:', response.error);
        }
    } catch (error) {
        console.error('API Error:', error);
        showConnectionError();
    }
}

// Get only verified students (admin-added or verified online registrations)
// Exclude pending students from financial calculations
function getVerifiedStudents(students) {
    return students.filter(s => {
        // Include if no status (admin-added) or if status is 'verified'
        return !s.status || s.status === 'verified';
    });
}

// Legacy function for backward compatibility
function getStudents() {
    return getVerifiedStudents(allStudents);
}

function showConnectionError() {
    console.warn('Cannot connect to server. Finance data may be outdated.');
}

// ==================== OVERVIEW CARDS ====================

function updateOverviewCards(students) {
    // Total revenue
    const totalRevenue = students.reduce((sum, s) => sum + (s.registrationFee || 0), 0);
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString();
    document.getElementById('totalStudentsRevenue').textContent = `From ${students.length} students`;

    // This month revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStudents = students.filter(s => new Date(s.registerDate) >= monthStart);
    const monthRevenue = monthStudents.reduce((sum, s) => sum + (s.registrationFee || 0), 0);
    document.getElementById('monthRevenue').textContent = monthRevenue.toLocaleString();
    document.getElementById('monthStudents').textContent = `${monthStudents.length} registrations`;

    // Average fee
    const avgFee = students.length > 0 ? Math.round(totalRevenue / students.length) : 0;
    document.getElementById('avgFee').textContent = avgFee.toLocaleString();

    // Most popular class
    const classCounts = {
        'physics': students.filter(s => s.classes && s.classes.includes('physics')).length,
        'chemistry': students.filter(s => s.classes && s.classes.includes('chemistry')).length,
        'combined-maths': students.filter(s => s.classes && s.classes.includes('combined-maths')).length
    };

    const maxClass = Object.entries(classCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
    const classNames = { 'physics': 'Physics', 'chemistry': 'Chemistry', 'combined-maths': 'C. Maths' };
    document.getElementById('popularClass').textContent = classNames[maxClass[0]] || '-';
    document.getElementById('popularClassCount').textContent = `${maxClass[1]} students`;
}

// ==================== CLASS REVENUE ====================

function updateClassRevenue(students) {
    const classData = {
        physics: { students: 0, revenue: 0 },
        chemistry: { students: 0, revenue: 0 },
        maths: { students: 0, revenue: 0 }
    };

    students.forEach(student => {
        if (!student.classes) return;
        const feePerClass = student.registrationFee / student.classes.length;

        if (student.classes.includes('physics')) {
            classData.physics.students++;
            classData.physics.revenue += feePerClass;
        }
        if (student.classes.includes('chemistry')) {
            classData.chemistry.students++;
            classData.chemistry.revenue += feePerClass;
        }
        if (student.classes.includes('combined-maths')) {
            classData.maths.students++;
            classData.maths.revenue += feePerClass;
        }
    });

    const totalRevenue = classData.physics.revenue + classData.chemistry.revenue + classData.maths.revenue;

    // Update Physics
    document.getElementById('physicsStudents').textContent = classData.physics.students;
    document.getElementById('physicsRevenue').textContent = Math.round(classData.physics.revenue).toLocaleString();
    const physicsPercent = totalRevenue > 0 ? (classData.physics.revenue / totalRevenue) * 100 : 0;
    document.getElementById('physicsBar').style.width = `${physicsPercent}%`;
    document.getElementById('physicsPercent').textContent = `${Math.round(physicsPercent)}% of total`;

    // Update Chemistry
    document.getElementById('chemistryStudents').textContent = classData.chemistry.students;
    document.getElementById('chemistryRevenue').textContent = Math.round(classData.chemistry.revenue).toLocaleString();
    const chemistryPercent = totalRevenue > 0 ? (classData.chemistry.revenue / totalRevenue) * 100 : 0;
    document.getElementById('chemistryBar').style.width = `${chemistryPercent}%`;
    document.getElementById('chemistryPercent').textContent = `${Math.round(chemistryPercent)}% of total`;

    // Update Maths
    document.getElementById('mathsStudents').textContent = classData.maths.students;
    document.getElementById('mathsRevenue').textContent = Math.round(classData.maths.revenue).toLocaleString();
    const mathsPercent = totalRevenue > 0 ? (classData.maths.revenue / totalRevenue) * 100 : 0;
    document.getElementById('mathsBar').style.width = `${mathsPercent}%`;
    document.getElementById('mathsPercent').textContent = `${Math.round(mathsPercent)}% of total`;
}

// ==================== PAYMENT TYPE ANALYTICS ====================

function updatePaymentTypeAnalytics(students) {
    // Bank Transfer (Online registration - verified only)
    const onlineStudents = students.filter(s => s.registrationType === 'online' && s.status === 'verified');
    const onlineCount = onlineStudents.length;
    const onlineRevenue = onlineStudents.reduce((sum, s) => sum + (s.registrationFee || 0), 0);

    // Local Payment (Manual registration - no registrationType or admin registered)
    const localStudents = students.filter(s => !s.registrationType || s.registrationType !== 'online');
    const localCount = localStudents.length;
    const localRevenue = localStudents.reduce((sum, s) => sum + (s.registrationFee || 0), 0);

    // Pending verification (Online but not verified yet)
    const pendingStudents = students.filter(s => s.registrationType === 'online' && s.status === 'pending');
    const pendingCount = pendingStudents.length;
    const pendingRevenue = pendingStudents.reduce((sum, s) => sum + (s.registrationFee || 0), 0);

    // Total for percentage calculation (only verified)
    const totalVerified = onlineCount + localCount;

    // Update Bank Transfer card
    document.getElementById('bankTransferCount').textContent = onlineCount;
    document.getElementById('bankTransferRevenue').textContent = `Rs. ${onlineRevenue.toLocaleString()}`;
    const bankPercent = totalVerified > 0 ? (onlineCount / totalVerified) * 100 : 0;
    document.getElementById('bankTransferBar').style.width = `${bankPercent}%`;
    document.getElementById('bankTransferPercent').textContent = `${Math.round(bankPercent)}% of students`;

    // Update Local Payment card
    document.getElementById('localPaymentCount').textContent = localCount;
    document.getElementById('localPaymentRevenue').textContent = `Rs. ${localRevenue.toLocaleString()}`;
    const localPercent = totalVerified > 0 ? (localCount / totalVerified) * 100 : 0;
    document.getElementById('localPaymentBar').style.width = `${localPercent}%`;
    document.getElementById('localPaymentPercent').textContent = `${Math.round(localPercent)}% of students`;

    // Update Pending card
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('pendingRevenue').textContent = `Rs. ${pendingRevenue.toLocaleString()}`;
}

// ==================== MONTHLY CHART ====================

function updateMonthlyChart(students) {
    const monthlyData = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
    }

    // Calculate revenue per month
    students.forEach(student => {
        const date = new Date(student.registerDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(key)) {
            monthlyData[key] += student.registrationFee || 0;
        }
    });

    const maxRevenue = Math.max(...Object.values(monthlyData), 1);
    const chartContainer = document.getElementById('monthlyChart');
    const labelsContainer = document.getElementById('chartLabels');

    chartContainer.innerHTML = Object.entries(monthlyData).map(([month, revenue]) => {
        const height = (revenue / maxRevenue) * 100;
        return `<div class="chart-bar" style="height: ${Math.max(height, 5)}%" title="Rs. ${revenue.toLocaleString()}"></div>`;
    }).join('');

    labelsContainer.innerHTML = Object.keys(monthlyData).map(month => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `<span class="chart-label">${monthNames[parseInt(m) - 1]}</span>`;
    }).join('');
}

// ==================== FEE DISTRIBUTION ====================

function updateFeeDistribution(students) {
    const feeData = {
        1000: { count: 0, total: 0 },
        2000: { count: 0, total: 0 },
        3000: { count: 0, total: 0 }
    };

    students.forEach(student => {
        const fee = student.registrationFee;
        if (feeData[fee]) {
            feeData[fee].count++;
            feeData[fee].total += fee;
        }
    });

    const maxCount = Math.max(...Object.values(feeData).map(d => d.count), 1);

    Object.entries(feeData).forEach(([fee, data]) => {
        const element = document.getElementById(`fee${fee}`);
        if (element) {
            const percent = (data.count / maxCount) * 100;
            element.querySelector('.fee-count').textContent = `${data.count} students`;
            element.querySelector('.fee-bar').style.width = `${percent}%`;
            element.querySelector('.fee-amount').textContent = `Rs. ${data.total.toLocaleString()}`;
        }
    });
}

// ==================== TRANSACTIONS TABLE ====================

function updateTransactionsTable(students) {
    const tbody = document.getElementById('transactionsBody');
    const emptyState = document.getElementById('emptyTransactions');

    // Sort by date descending and take last 10
    const recentStudents = [...students]
        .sort((a, b) => new Date(b.registerDate) - new Date(a.registerDate))
        .slice(0, 10);

    if (recentStudents.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = recentStudents.map((student, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${student.firstName} ${student.lastName}</td>
            <td>${renderClassBadges(student.classes)}</td>
            <td>${formatDate(student.registerDate)}</td>
            <td><strong>Rs. ${student.registrationFee.toLocaleString()}</strong></td>
        </tr>
    `).join('');
}

function renderClassBadges(classes) {
    if (!classes || classes.length === 0) return '-';
    return classes.map(c => {
        const displayName = c === 'combined-maths' ? 'C.Maths' : capitalizeFirst(c);
        return `<span class="class-badge ${c}">${displayName}</span>`;
    }).join(' ');
}

// ==================== FILTERS ====================

function initializeFilters() {
    const applyBtn = document.getElementById('applyFilters');
    const resetBtn = document.getElementById('resetFilters');

    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    let students = getVerifiedStudents(allStudents);

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const classType = document.getElementById('classTypeFilter').value;
    const feeRange = document.getElementById('feeRangeFilter').value;

    // Date filter
    if (startDate) {
        students = students.filter(s => s.registerDate >= startDate);
    }
    if (endDate) {
        students = students.filter(s => s.registerDate <= endDate);
    }

    // Class filter
    if (classType) {
        students = students.filter(s => s.classes && s.classes.includes(classType));
    }

    // Fee filter
    if (feeRange) {
        students = students.filter(s => s.registrationFee === parseInt(feeRange));
    }

    // Update all displays with filtered data
    updateOverviewCards(students);
    updateClassRevenue(students);
    updateMonthlyChart(students);
    updateFeeDistribution(students);
    updateTransactionsTable(students);
}

function resetFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('classTypeFilter').value = '';
    document.getElementById('feeRangeFilter').value = '';

    loadFinanceData();
}

// ==================== EXPORT ====================

function initializeExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
}

function exportReport() {
    const students = getVerifiedStudents(allStudents);

    // Create CSV content
    const headers = ['Student ID', 'Name', 'Email', 'Mobile', 'Gender', 'Classes', 'Registration Date', 'Fee'];
    const rows = students.map(s => [
        s._id || s.id,
        `${s.firstName} ${s.lastName}`,
        s.email,
        s.mobile,
        s.gender,
        s.classes ? s.classes.join('; ') : '',
        s.registerDate,
        s.registrationFee
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eduphysics_finance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ==================== UTILITY FUNCTIONS ====================

function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
