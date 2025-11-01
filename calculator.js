/**
 * Retirement Scenario Calculator: Comparison (v12)
 * Author: dluvbell
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Data Store for Scenario 2 C/W ---
    let cashFlowItems = [];

    // --- Modal Logic (Welcome) ---
    const welcomeModalOverlay = document.getElementById('welcome-modal-overlay');
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    agreementCheckbox.addEventListener('change', () => {
        confirmBtn.disabled = !agreementCheckbox.checked;
    });

    confirmBtn.addEventListener('click', () => {
        welcomeModalOverlay.style.display = 'none';
    });
    
    // --- Modal Logic (C/W Management) ---
    const inputModalOverlay = document.getElementById('input-modal-overlay');
    const manageCwBtn = document.getElementById('manage-cw-btn');
    const addContBtn = document.getElementById('add-contribution-btn');
    const addWithdrawalBtn = document.getElementById('add-withdrawal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cwInputsContainer = document.getElementById('cw-inputs-container');

    manageCwBtn.addEventListener('click', () => {
        renderCashFlowInputs();
        inputModalOverlay.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        cashFlowItems = readCashFlowInputs();
        inputModalOverlay.classList.add('hidden');
    });

    addContBtn.addEventListener('click', () => {
        const todayYear = new Date().getFullYear();
        cashFlowItems.push({ id: Date.now(), type: 'Contribution', amount: 10000, startYear: todayYear + 1, endYear: todayYear + 13, cola: 0.0 });
        renderCashFlowInputs();
    });

    addWithdrawalBtn.addEventListener('click', () => {
        const todayYear = new Date().getFullYear();
        cashFlowItems.push({ id: Date.now(), type: 'Withdrawal', amount: 5000, startYear: todayYear + 1, endYear: todayYear + 13, cola: 0.0 });
        renderCashFlowInputs();
    });

    function readCashFlowInputs() {
        const inputs = [];
        const items = cwInputsContainer.querySelectorAll('.cw-input-item');
        items.forEach(item => {
            const id = parseInt(item.dataset.id);
            const type = item.dataset.type;
            const amount = parseFloat(item.querySelector('[data-name="amount"]').value);
            const startYear = parseInt(item.querySelector('[data-name="startYear"]').value);
            const endYear = parseInt(item.querySelector('[data-name="endYear"]').value);
            const cola = parseFloat(item.querySelector('[data-name="cola"]').value) / 100;
            
            if (!isNaN(amount) && !isNaN(startYear) && !isNaN(endYear) && !isNaN(cola)) {
                inputs.push({ id, type, amount, startYear, endYear, cola });
            }
        });
        return inputs;
    }

    function renderCashFlowInputs() {
        cwInputsContainer.innerHTML = '';
        cashFlowItems.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cw-input-item';
            itemEl.dataset.id = item.id;
            itemEl.dataset.type = item.type;
            itemEl.innerHTML = `
                <h4>${item.type} ${index + 1}</h4>
                <button class="remove-btn" data-id="${item.id}">×</button>
                <div class="cw-input-grid">
                    <div class="input-group">
                        <label>Amount ($)</label>
                        <input type="number" data-name="amount" value="${item.amount}">
                    </div>
                    <div class="input-group">
                        <label>Start Year</label>
                        <input type="number" data-name="startYear" value="${item.startYear}">
                    </div>
                    <div class="input-group">
                        <label>End Year</label>
                        <input type="number" data-name="endYear" value="${item.endYear}">
                    </div>
                    <div class="input-group">
                        <label>COLA (%)</label>
                        <input type="number" data-name="cola" value="${(item.cola * 100).toFixed(1)}" step="0.1">
                    </div>
                </div>
            `;
            cwInputsContainer.appendChild(itemEl);
        });

        cwInputsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idToRemove = parseInt(e.target.dataset.id);
                cashFlowItems = cashFlowItems.filter(item => item.id !== idToRemove);
                renderCashFlowInputs();
            });
        });
    }

    // --- Dark Mode ---
    const themeToggle = document.getElementById('checkbox');
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        // Update chart colors
        const comparisonChart = document.getElementById('comparison-chart').chart;
        if (comparisonChart) updateChartColors(comparisonChart);
    });

    // --- Calculator & Elements ---
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const intermediateResultEl = document.getElementById('intermediate-result');
    const resultText = document.getElementById('result-text');
    
    // [수정] Graph and Table elements
    const graphContainer = document.getElementById('graph-container');
    const graphToggle = document.getElementById('graph-toggle');
    const comparisonChartCanvas = document.getElementById('comparison-chart');
    let comparisonChart = null;
    
    // [추가] Detailed View elements
    const tableContainer = document.getElementById('details-table-container');
    const detailsToggle = document.getElementById('details-toggle'); 

    // --- Utility Functions ---
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPerYear = 365.25;

    function calculateAge(date, birthYear) {
        if (isNaN(birthYear)) return 0;
        const yearDiff = date.getFullYear() - birthYear;
        return yearDiff; 
    }
    
    function updateAges() {
        const birthYear = parseInt(document.getElementById('birth_year').value);
        if (isNaN(birthYear)) {
            ['pension_start', 'pension_end', 'cv_start', 'cv_end'].forEach(id => document.getElementById(`age_${id}`).textContent = 'Age: -');
            return;
        }

        const dates = {
            pension_start: document.getElementById('pension_payout_start_date').valueAsDate,
            pension_end: document.getElementById('pension_payout_end_date').valueAsDate,
            cv_start: document.getElementById('cv_start_date').valueAsDate,
            cv_end: document.getElementById('cv_end_date').valueAsDate
        };

        for (const [key, date] of Object.entries(dates)) {
            const ageElement = document.getElementById(`age_${key}`);
            if (date) {
                ageElement.textContent = `Age: ${calculateAge(date, birthYear)}`;
            } else {
                ageElement.textContent = 'Age: -';
            }
        }
    }

    // --- Initialize Defaults and Event Listeners ---
    const today = new Date();
    document.getElementById('current_date').valueAsDate = today;
    
    // Scenario 1 Defaults (Start/End Date)
    document.getElementById('pension_payout_start_date').value = `${today.getFullYear() + 14}-01-01`; 
    document.getElementById('pension_payout_end_date').value = `${today.getFullYear() + 14 + 30}-01-01`; 

    // Scenario 2 Asset Defaults (Start/End Date)
    document.getElementById('cv_start_date').value = `${today.getFullYear()}-01-01`; 
    document.getElementById('cv_end_date').value = `${today.getFullYear() + 44}-01-01`; 
    
    updateAges();

    // [수정] asset_growth_rate 추가
    const inputIds = {
        numbers: ['birth_year', 'inflation_rate', 'initial_cv_value', 'annual_payout_today', 'payout_cola', 'asset_growth_rate'],
        dates: ['current_date', 'pension_payout_start_date', 'pension_payout_end_date', 'cv_start_date', 'cv_end_date']
    };

    for (const id of ['birth_year', 'current_date', 'pension_payout_start_date', 'pension_payout_end_date', 'cv_start_date', 'cv_end_date']) {
        document.getElementById(id).addEventListener('change', updateAges);
    }
    
    // Set initial C/W item (for pop-up data initialization)
    if (cashFlowItems.length === 0) {
        const todayYear = today.getFullYear();
        cashFlowItems.push({ id: Date.now(), type: 'Contribution', amount: 10000, startYear: todayYear + 1, endYear: todayYear + 13, cola: 0.0 });
    }

    // --- Main Calculation Logic ---
    calculateBtn.addEventListener('click', () => {
        // 1. Read values and perform basic validation
        const values = {};
        for (const id of inputIds.numbers) {
            const value = parseFloat(document.getElementById(id).value);
            if (isNaN(value)) {
                alert(`Please enter a valid number in the '${id}' field.`);
                return;
            }
            values[id] = value;
        }
        for (const id of inputIds.dates) {
            const value = document.getElementById(id).value;
            if (!value) {
                alert(`Please fill in the date field '${id}'.`);
                return;
            }
            values[id] = new Date(value);
        }
        
        // Ensure the latest C/W data is used
        cashFlowItems = readCashFlowInputs();
        
        // Convert percentage inputs to decimals
        values.inflation_rate /= 100;
        values.payout_cola /= 100;
        values.asset_growth_rate /= 100; 
        
        // --- Date and Time Calculations ---
        // [수정] Get current year for C/W COLA calculation
        const currentYear = values.current_date.getFullYear();
        
        // Scenario 1 Period
        const pensionStartYear = values.pension_payout_start_date.getFullYear();
        const pensionEndYear = values.pension_payout_end_date.getFullYear();
        const n_payout_inflation_years = (values.pension_payout_start_date - values.current_date) / msPerDay / daysPerYear; 

        // Scenario 2 Period
        const cvStartYear = values.cv_start_date.getFullYear();
        const cvEndYear = values.cv_end_date.getFullYear();

        // Validation
        if (pensionEndYear < pensionStartYear) {
            alert("Scenario 1 Dates Error: Payout End Date must be greater than or equal to Payout Start Date.");
            return;
        }
        if (cvEndYear < cvStartYear) {
            alert("Scenario 2 Dates Error: Asset End Date must be greater than or equal to Asset Start Date.");
            return;
        }
        if (n_payout_inflation_years < 0) {
            alert("Date Chronology Error: Current Date must be earlier than Payout Start Date.");
            return;
        }

        // --- Scenario 1 Payout Setup ---
        const first_payout_at_start = values.annual_payout_today * Math.pow(1 + values.inflation_rate, n_payout_inflation_years);
        
        // --- Run Independent Simulations ---
        
        // Determine the full range of years for the chart (min of start dates, max of end dates)
        const simStartYear = Math.min(cvStartYear, pensionStartYear);
        const simEndYear = Math.max(cvEndYear, pensionEndYear);

        // Run Scenario 1 Simulation (Cumulative FV)
        const scenario1Data = getScenario1Data(simStartYear, simEndYear, pensionStartYear, pensionEndYear, first_payout_at_start, values.payout_cola);
        
        // [수정] Pass currentYear to Scenario 2 simulation
        const scenario2Data = getScenario2Data(simStartYear, simEndYear, cvStartYear, currentYear, values.initial_cv_value, cashFlowItems, values.asset_growth_rate);

        resultContainer.classList.remove('hidden');
        
        const finalS1Value = scenario1Data[scenario1Data.length - 1].cumulativePayout;
        const finalS2Value = scenario2Data[scenario2Data.length - 1].balance;

        intermediateResultEl.innerHTML = `
            At year ${simEndYear}:<br>
            Scenario 1 (Pension) Total Cumulative Payout: <b>$${finalS1Value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
            <br>
            Scenario 2 (Asset) Final Value: <b>$${finalS2Value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
        `;
        resultText.innerHTML = `Comparison based on an expected asset growth rate of <strong>${(values.asset_growth_rate * 100).toFixed(2)}%</strong>.`;

        // Generate Comparison Chart
        generateComparisonChart(
            simStartYear,
            simEndYear,
            values.birth_year,
            scenario1Data,
            scenario2Data
        );
        
        // [추가] Generate Details Table
        generateDetailsTable(values.birth_year, scenario1Data, scenario2Data);
        
        // [수정] Show/Hide based on toggles
        graphContainer.style.display = graphToggle.checked ? 'block' : 'none';
        tableContainer.style.display = detailsToggle.checked ? 'block' : 'none';

    });

    // [수정] graphToggle: Hide/Show only graph
    graphToggle.addEventListener('change', () => {
        const chart = document.getElementById('comparison-chart').chart;
        if (chart) {
            graphContainer.style.display = graphToggle.checked ? 'block' : 'none';
        }
    });

    // [추가] detailsToggle: Hide/Show only table
    detailsToggle.addEventListener('change', () => {
        if (tableContainer.innerHTML.trim() !== '') {
            tableContainer.style.display = detailsToggle.checked ? 'block' : 'none';
        }
    });


    // --- [NEW] Financial Model Functions (v11) ---

    /**
     * Calculates Scenario 1: Cumulative Pension Payout FV
     */
    function getScenario1Data(simStartYear, simEndYear, pensionStartYear, pensionEndYear, first_payout, payout_cola) {
        const data = [];
        let cumulativePayout = 0;
        
        for (let year = simStartYear; year <= simEndYear; year++) {
            
            if (year >= pensionStartYear && year <= pensionEndYear) {
                const n_cola_periods = year - pensionStartYear;
                const currentPayout = first_payout * Math.pow(1 + payout_cola, n_cola_periods);
                cumulativePayout += currentPayout;
            }
            
            data.push({
                year: year,
                cumulativePayout: cumulativePayout
            });
        }
        return data;
    }
    
    /**
     * [MODIFIED] Calculates Scenario 2: Simulated Asset FV
     * Accepts currentYear to apply COLA from "Today"
     */
    function getScenario2Data(simStartYear, simEndYear, cvStartYear, currentYear, cv, cw_items, g_asset) {
        const data = [];
        let currentBalance = 0; // Balance is 0 before the asset start date
        
        if (simStartYear >= cvStartYear) {
            currentBalance = cv;
        }

        // Pre-process C/W items for easier lookup by year
        const cwMap = {};
        cw_items.forEach(item => {
            for (let year = item.startYear; year <= item.endYear; year++) {
                if (!cwMap[year]) cwMap[year] = [];
                cwMap[year].push(item);
            }
        });

        for (let year = simStartYear; year <= simEndYear; year++) {
            
            // If the simulation starts before the CV start date, balance remains 0
            if (year < cvStartYear) {
                data.push({ year: year, balance: 0 });
                continue;
            }
            
            // If this is the CV start year, set the balance *before* growth
            if (year === cvStartYear) {
                currentBalance = cv;
            }

            // 1. Calculate Growth based on the balance at the START of the year
            const growthAmount = currentBalance * g_asset;
            
            // 2. Apply Annual Cash Flows (C/W) - Net Cash Flow
            let netCashFlow = 0;
            if (cwMap[year]) {
                cwMap[year].forEach(item => {
                    // [MODIFIED] Apply item.cola from currentYear (Today) to the current 'year'
                    // This treats item.amount as "Today's Value"
                    const n_cola_periods = Math.max(0, year - currentYear);
                    const adjustedAmount = item.amount * Math.pow(1 + item.cola, n_cola_periods);
                    netCashFlow += (item.type === 'Contribution' ? 1 : -1) * adjustedAmount;
                });
            }
            
            // 3. Apply Payouts - NOT APPLIED (Scenarios are separate)

            // 4. Calculate Ending Balance
            currentBalance = currentBalance + growthAmount + netCashFlow;
            
            data.push({
                year: year,
                balance: currentBalance
            });
        }

        return data;
    }
    
    // --- Charting Function ---
    
    /**
     * Generates a combined chart comparing S1 (Cumulative FV) and S2 (Simulated FV).
     */
    function generateComparisonChart(simStartYear, simEndYear, birthYear, scenario1Data, scenario2Data) {
        if (comparisonChart) comparisonChart.destroy(); 
        
        const labels = scenario1Data.map(d => d.year);
        const dataPoints1 = scenario1Data.map(d => d.cumulativePayout); // Pension FV
        const dataPoints2 = scenario2Data.map(d => d.balance); // Asset FV
        const ages = labels.map(year => year - birthYear);

        // Determine min/max for chart scale
        const allData = [...dataPoints1, ...dataPoints2];
        const minVal = Math.min(0, ...allData) * 1.1; // Ensure 0 is included
        const maxVal = Math.max(...allData) * 1.1;

        comparisonChart = createChart(
            comparisonChartCanvas, 
            labels, 
            [
                {
                    label: 'Scenario 2: Asset FV',
                    data: dataPoints2,
                    borderColor: '#007bff', // Blue
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: false,
                    type: 'line',
                },
                {
                    label: 'Scenario 1: Pension Cumulative FV',
                    data: dataPoints1,
                    borderColor: '#dc3545', // Red
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: false,
                    borderDash: [5, 5],
                    type: 'line',
                }
            ],
            'line',
            { 
                y: { 
                    beginAtZero: true, 
                    min: minVal,
                    max: maxVal,
                    title: { display: true, text: 'Future Value ($)' } 
                } 
            },
            ages // Pass ages array to createChart
        );
        
        comparisonChartCanvas.chart = comparisonChart;
    }
    
    // [추가] Detailed View Table Generation Function
    function generateDetailsTable(birthYear, scenario1Data, scenario2Data) {
        tableContainer.innerHTML = ''; 
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Age</th>
                    <th>S1: Pension (Cumulative FV)</th>
                    <th>S2: Asset (Balance FV)</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        
        for (let i = 0; i < scenario1Data.length; i++) {
            const year = scenario1Data[i].year;
            const age = year - birthYear;
            const s1_fv = scenario1Data[i].cumulativePayout;
            const s2_fv = scenario2Data[i].balance;

            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${year}</td>
                <td>${age}</td>
                <td>$${s1_fv.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${s2_fv.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
        }
        
        tableContainer.appendChild(table);
    }
    
    // --- Standard Charting and Utility Functions (Reused) ---

    function createChart(canvas, labels, datasets, type, scalesOverrides = {}, ages = []) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#e0e0e0' : '#333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        if (canvas.chart) canvas.chart.destroy();

        const chart = new Chart(canvas, {
            type: type,
            data: {
                labels: labels,
                datasets: datasets.map(d => ({
                    ...d,
                    fill: d.fill !== undefined ? d.fill : (type === 'line' ? true : false),
                    tension: type === 'line' ? 0.1 : 0,
                    pointRadius: type === 'line' ? 3 : 0,
                }))
            },
            options: {
                responsive: true,
                // Interactive Tooltip on Vertical Line
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) { return '$' + value.toLocaleString(); },
                            color: textColor
                        },
                        grid: { color: gridColor },
                        ...scalesOverrides.y
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        ...scalesOverrides.x
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    },
                    // Tooltip formatting for Age and Both Scenarios
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const year = tooltipItems[0].label;
                                const index = tooltipItems[0].dataIndex;
                                const age = ages[index];
                                return `Year: ${year} (Age: ${age})`;
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        canvas.chart = chart;
        return chart;
    }

    function updateChartColors(chart) {
        if (!chart) return;
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#e0e0e0' : '#333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;
        chart.update();
    }
});
