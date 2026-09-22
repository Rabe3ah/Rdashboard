// Sample default data matching your headers
let rawData = [
    {captain_id: 101, city: "Amman", captain_name: "Ahmad Ali", sex: "M", phone_number: "+962790000001", join_date: "2024-01-10", limo_company_name: "Alpha Fleet", cumulative_trip_count: 1420, tier: "Gold", captain_block_status: "Active", balance: -15.50, cash_block: "No"},
    {captain_id: 102, city: "Irbid", captain_name: "Omar Khaled", sex: "M", phone_number: "+962780000002", join_date: "2024-03-15", limo_company_name: "Beta Limo", cumulative_trip_count: 850, tier: "Silver", captain_block_status: "Active", balance: 45.00, cash_block: "No"},
    {captain_id: 103, city: "Amman", captain_name: "Tariq Ziad", sex: "M", phone_number: "+962770000003", join_date: "2023-11-20", limo_company_name: "Alpha Fleet", cumulative_trip_count: 2300, tier: "Platinum", captain_block_status: "Active", balance: -120.00, cash_block: "Yes"},
    {captain_id: 104, city: "Zarqa", captain_name: "Mohammed Nour", sex: "M", phone_number: "+962791111111", join_date: "2024-05-01", limo_company_name: "Gamma Transit", cumulative_trip_count: 410, tier: "Bronze", captain_block_status: "Blocked", balance: 5.00, cash_block: "Yes"},
    {captain_id: 105, city: "Amman", captain_name: "Sami Youssef", sex: "M", phone_number: "+962782222222", join_date: "2023-08-12", limo_company_name: "Beta Limo", cumulative_trip_count: 1900, tier: "Platinum", captain_block_status: "Active", balance: 230.50, cash_block: "No"}
];

let currentData = [...rawData];
let tierChartInstance = null;
let companyChartInstance = null;

// Initialize dashboard on load
window.onload = function() {
    populateDropdowns();
    updateDashboard(currentData);
};

// Handle CSV / TSV Paste from Excel or Google Sheets
function loadCustomData() {
    const text = document.getElementById('csvInput').value.trim();
    if (!text) return;

    const lines = text.split('\n');
    const headers = lines[0].split(/[\t,]/).map(h => h.trim());
    
    let parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(/[\t,]/);
        if (currentLine.length === headers.length) {
            let rowObj = {};
            headers.forEach((header, index) => {
                let val = currentLine[index].trim();
                // Try converting numeric fields automatically
                if (!isNaN(val) && val !== "") val = Number(val);
                rowObj[header] = val;
            });
            parsedRows.push(rowObj);
        }
    }

    if (parsedRows.length > 0) {
        rawData = parsedRows;
        populateDropdowns();
        filterData();
    } else {
        alert("Could not parse data. Ensure headers and columns match correctly.");
    }
}

// Populate Filter Dropdowns dynamically
function populateDropdowns() {
    const cities = [...new Set(rawData.map(d => d.city))];
    const companies = [...new Set(rawData.map(d => d.limo_company_name))];

    const citySelect = document.getElementById('cityFilter');
    citySelect.innerHTML = '<option value="ALL">All Cities</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');

    const companySelect = document.getElementById('companyFilter');
    companySelect.innerHTML = '<option value="ALL">All Companies</option>' + companies.map(comp => `<option value="${comp}">${comp}</option>`).join('');
}

// Filter logic based on dropdowns & search bar
function filterData() {
    const selectedCity = document.getElementById('cityFilter').value;
    const selectedCompany = document.getElementById('companyFilter').value;
    const selectedStatus = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    currentData = rawData.filter(row => {
        const matchesCity = selectedCity === 'ALL' || row.city === selectedCity;
        const matchesCompany = selectedCompany === 'ALL' || row.limo_company_name === selectedCompany;
        const matchesStatus = selectedStatus === 'ALL' || row.captain_block_status === selectedStatus;
        
        const searchableText = `${row.captain_name || ''} ${row.captain_id || ''} ${row.phone_number || ''}`.toLowerCase();
        const matchesSearch = searchableText.includes(searchQuery);

        return matchesCity && matchesCompany && matchesStatus && matchesSearch;
    });

    updateDashboard(currentData);
}

// Update Metrics, Charts, and Table
function updateDashboard(data) {
    // 1. Metrics calculations
    const totalCaptains = data.length;
    const activeCaptains = data.filter(d => d.captain_block_status === 'Active').length;
    const totalTrips = data.reduce((sum, d) => sum + (Number(d.cumulative_trip_count) || 0), 0);
    const totalBalance = data.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
    const cashBlocked = data.filter(d => d.cash_block === 'Yes').length;
    const avgTrips = totalCaptains > 0 ? Math.round(totalTrips / totalCaptains) : 0;

    document.getElementById('metricCaptains').innerText = totalCaptains.toLocaleString();
    document.getElementById('metricActiveCaptains').innerText = `${activeCaptains} Active`;
    document.getElementById('metricTrips').innerText = totalTrips.toLocaleString();
    document.getElementById('metricBalance').innerText = `$${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('metricCashBlocked').innerText = cashBlocked;
    document.getElementById('metricAvgTrips').innerText = avgTrips.toLocaleString();

    // 2. Render Charts
    renderTierChart(data);
    renderCompanyChart(data);

    // 3. Render Table
    renderTable(data);
}

// Render Bar Chart (Tier)
function renderTierChart(data) {
    const tierCounts = {};
    data.forEach(d => {
        const tier = d.tier || 'Unknown';
        tierCounts[tier] = (tierCounts[tier] || 0) + (Number(d.cumulative_trip_count) || 0);
    });

    const ctx = document.getElementById('tierChart').getContext('2d');
    if (tierChartInstance) tierChartInstance.destroy();

    tierChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tierCounts),
            datasets: [{
                data: Object.values(tierCounts),
                backgroundColor: ['#6366f1', '#ec4899', '#3b82f6', '#10b981'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { grid: { display: false } }
        }
    });
}

// Render Donut Chart (Limo Company)
function renderCompanyChart(data) {
    const compCounts = {};
    data.forEach(d => {
        const comp = d.limo_company_name || 'Other';
        compCounts[comp] = (compCounts[comp] || 0) + (Number(d.cumulative_trip_count) || 0);
    });

    const ctx = document.getElementById('companyChart').getContext('2d');
    if (companyChartInstance) companyChartInstance.destroy();

    companyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(compCounts),
            datasets: [{
                data: Object.values(compCounts),
                backgroundColor: ['#0f172a', '#3b82f6', '#93c5fd', '#cbd5e1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
        }
    });
}

// Render HTML Table dynamically
function renderTable(data) {
    const headersEl = document.getElementById('tableHeaders');
    const bodyEl = document.getElementById('tableBody');

    headersEl.innerHTML = '';
    bodyEl.innerHTML = '';

    if (data.length === 0) {
        bodyEl.innerHTML = `<tr><td colspan="100" class="p-4 text-center text-slate-400">No matching captain records found.</td></tr>`;
        return;
    }

    const columns = Object.keys(data[0]);

    // Build Table Headers
    columns.forEach(col => {
        const th = document.createElement('th');
        th.className = 'p-3 font-semibold uppercase tracking-wider text-[11px]';
        th.innerText = col.replaceAll('_', ' ');
        headersEl.appendChild(th);
    });

    // Build Table Rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.className = 'p-3 text-slate-700 whitespace-nowrap';
            td.innerText = row[col] !== undefined ? row[col] : '';
            tr.appendChild(td);
        });
        bodyEl.appendChild(tr);
    });
}
