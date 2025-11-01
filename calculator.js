/**
 * Retirement Scenario Calculator: Comparison (v15 - Dropdown)
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

    // [수정] inputIds for Monte Carlo
    const inputIds = {
        numbers: ['birth_year', 'inflation_rate', 'initial_cv_value', 'annual_payout_today', 'payout_cola', 
                  'mean_return', 'volatility', 'simulation_count'],
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
            // [수정] Read from select or input
            const element = document.getElementById(id);
            const value = parseFloat(element.value);
            
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

        // [추가] Warning for high simulation count
        if (values.simulation_count > 10000) {
            if (!confirm(`Running ${values.simulation_count.toLocaleString()} simulations may take several seconds and might make the browser unresponsive. Do you want to continue?`)) {
                return; // Abort calculation
            }
        }
        
        // Ensure the latest C/W data is used
        cashFlowItems = readCashFlowInputs();
        
        // Convert percentage inputs to decimals
        values.inflation_rate /= 100;
        values.payout_cola /= 100;
        // [수정] Monte Carlo inputs to decimals
        values.mean_return /= 100; 
        values.volatility /= 100;
        
        // --- Date and Time Calculations ---
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
        
        // --- [수정] Run Simulations ---
        
        const simStartYear = Math.min(cvStartYear, pensionStartYear);
        const simEndYear = Math.max(cvEndYear, pensionEndYear);

        // Run Scenario 1 Simulation (Deterministic)
        const scenario1Data = getScenario1Data(simStartYear, simEndYear, pensionStartYear, pensionEndYear, first_payout_at_start, values.payout_cola);
        
        // Run Scenario 2 Monte Carlo Simulation
        const simulationPaths = runMonteCarloSimulation(
            values.simulation_count, simStartYear, simEndYear, cvStartYear, currentYear, 
            values.initial_cv_value, cashFlowItems, values.mean_return, values.volatility
        );
        
        // Process results to get percentiles
        const scenario2Data = processSimulationResults(simulationPaths, simStartYear, simEndYear);

        resultContainer.classList.remove('hidden');
        
        const finalS1Value = scenario1Data[scenario1Data.length - 1].cumulativePayout;
        const finalS2Median = scenario2Data[scenario2Data.length - 1].p50;
        const finalS2P5 = scenario2Data[scenario2Data.length - 1].p5;
        const finalS2P95 = scenario2Data[scenario2Data.length - 1].p95;

        intermediateResultEl.innerHTML = `
            At year ${simEndYear} (after ${values.simulation_count.toLocaleString()} simulations):<br>
            Scenario 1 (Pension) Total Cumulative Payout: <b>$${finalS1Value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
            <br>
            Scenario 2 (Asset) 50th Percentile (Median): <b>$${finalS2Median.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
            <br>
            Scenario 2 (Asset) 90% Confidence Range: <b>$${finalS2P5.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b> to <b>$${finalS2P95.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
        `;
        resultText.innerHTML = `Comparison based on Mean Return: <strong>${(values.mean_return * 100).toFixed(2)}%</strong>, Volatility: <strong>${(values.volatility * 100).toFixed(2)}%</strong>.`;

        // Generate Comparison Chart
        generateComparisonChart(
            values.birth_year,
            scenario1Data,
            scenario2Data
        );
        
        // Generate Details Table
        generateDetailsTable(values.birth_year, scenario1Data, scenario2Data);
        
        // Show/Hide based on toggles
        graphContainer.style.display = graphToggle.checked ? 'block' : 'none';
        tableContainer.style.display = detailsToggle.checked ? 'block' : 'none';

    });

    // Toggle Listeners
    graphToggle.addEventListener('change', () => {
        const chart = document.getElementById('comparison-chart').chart;
        if (chart) {
            graphContainer.style.display = graphToggle.checked ? 'block' : 'none';
        }
    });

    detailsToggle.addEventListener('change', () => {
        if (tableContainer.innerHTML.trim() !== '') {
            tableContainer.style.display = detailsToggle.checked ? 'block' : 'none';
        }
    });


    // --- [NEW] Financial Model Functions (v14) ---

    /**
     * [HELPER] Standard Normal (z-score) random number generator (Box-Muller transform)
     */
    function getNormalRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    /**
     * Calculates Scenario 1: Cumulative Pension Payout FV (Unchanged)
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
     * [MODIFIED] Runs the Monte Carlo Simulation (Scenario 2) with correct C/W timing
     */
    function runMonteCarloSimulation(simulationCount, simStartYear, simEndYear, cvStartYear, currentYear, cv, cw_items, mean, volatility) {
        const allPaths = []; // Array to store all simulation paths

        // Pre-process C/W items for easier lookup by year
        const cwMap = {};
        cw_items.forEach(item => {
            for (let year = item.startYear; year <= item.endYear; year++) {
                if (!cwMap[year]) cwMap[year] = [];
                cwMap[year].push(item);
            }
        });

        for (let i = 0; i < simulationCount; i++) {
            const currentPath = [];
            let currentBalance = 0;
            
            if (simStartYear >= cvStartYear) {
                currentBalance = cv;
            }
            
            for (let year = simStartYear; year <= simEndYear; year++) {
                
                if (year < cvStartYear) {
                    currentPath.push({ year: year, balance: 0 });
                    continue;
                }
                
                if (year === cvStartYear) {
                    currentBalance = cv;
                }

                // [FIX START] Apply C/W logic correctly (Withdrawal at Start, Contribution at End)
                let balanceAfterWithdrawal = currentBalance;
                let contribution = 0;

                // 1. Apply Withdrawals (Start of Year)
                if (cwMap[year]) {
                    cwMap[year].forEach(item => {
                        if (item.type === 'Withdrawal') {
                            const n_cola_periods = Math.max(0, year - currentYear);
                            const adjustedAmount = item.amount * Math.pow(1 + item.cola, n_cola_periods);
                            balanceAfterWithdrawal -= adjustedAmount;
                        }
                    });
                }
                
                // 2. Calculate Growth (on balance after withdrawal)
                const randomReturn = getNormalRandom() * volatility + mean;
                const growthAmount = balanceAfterWithdrawal * randomReturn;
                let balanceAfterGrowth = balanceAfterWithdrawal + growthAmount;
                
                // 3. Apply Contributions (End of Year)
                 if (cwMap[year]) {
                    cwMap[year].forEach(item => {
                        if (item.type === 'Contribution') {
                            const n_cola_periods = Math.max(0, year - currentYear);
                            const adjustedAmount = item.amount * Math.pow(1 + item.cola, n_cola_periods);
                            balanceAfterGrowth += adjustedAmount;
                        }
                    });
                }
                // [FIX END]

                // 4. Set Ending Balance
                currentBalance = balanceAfterGrowth;
                
                currentPath.push({
                    year: year,
                    balance: currentBalance
                });
            }
            allPaths.push(currentPath);
        }
        return allPaths;
    }

    /**
     * [NEW] Processes the raw simulation paths into percentiles
     */
    function processSimulationResults(allPaths, simStartYear, simEndYear) {
        const percentileData = [];
        const simulationCount = allPaths.length;
        
        for (let year = simStartYear; year <= simEndYear; year++) {
            const balancesForYear = [];
            
            // Find the index for the current year (all paths have same length)
            const yearIndex = year - simStartYear; 
            
            for (let i = 0; i < simulationCount; i++) {
                balancesForYear.push(allPaths[i][yearIndex].balance);
            }
            
            // Sort the balances to find percentiles
            balancesForYear.sort((a, b) => a - b);
            
            // Get 5th, 50th (Median), and 95th percentiles
            const p5_index = Math.floor(simulationCount * 0.05);
            const p50_index = Math.floor(simulationCount * 0.50);
            const p95_index = Math.floor(simulationCount * 0.95);
            
            percentileData.push({
                year: year,
                p5: balancesForYear[p5_index],
                p50: balancesForYear[p50_index],
                p95: balancesForYear[p95_index]
            });
        }
        return percentileData;
    }

    // --- Charting Function ---
    
    /**
     * [MODIFIED] Generates a chart with confidence bands
     */
    function generateComparisonChart(birthYear, scenario1Data, scenario2Data) {
        if (comparisonChart) comparisonChart.destroy(); 
        
        const labels = scenario1Data.map(d => d.year);
        const ages = labels.map(year => year - birthYear);

        const s1_fv = scenario1Data.map(d => d.cumulativePayout);
        const s2_p5 = scenario2Data.map(d => d.p5);
        const s2_p50 = scenario2Data.map(d => d.p50);
        const s2_p95 = scenario2Data.map(d => d.p95);

        const allData = [...s1_fv, ...s2_p5, ...s2_p95]; // p50 is within p5/p95
        const minVal = Math.min(0, ...allData) * 1.1; 
        const maxVal = Math.max(...allData) * 1.1;

        const s2_band_color = 'rgba(0, 123, 255, 0.1)'; // Light blue
        const s2_median_color = 'rgba(0, 123, 255, 1)'; // Solid blue
        const s1_color = '#dc3545'; // Red

        comparisonChart = createChart(
            comparisonChartCanvas, 
            labels, 
            [
                {
                    label: 'Scenario 1: Pension Cumulative FV',
                    data: s1_fv,
                    borderColor: s1_color,
                    fill: false,
                    borderDash: [5, 5],
                    type: 'line',
                },
                 {
                    label: 'S2: 5th Percentile',
                    data: s2_p5,
                    borderColor: s2_band_color,
                    backgroundColor: 'transparent',
                    fill: false,
                    pointRadius: 0,
                    type: 'line',
                },
                {
                    label: 'S2: 95th Percentile (90% CI)',
                    data: s2_p95,
                    borderColor: s2_band_color,
                    backgroundColor: s2_band_color, // Shaded area
                    fill: '-1', // Fill to the dataset above (p5)
                    pointRadius: 0,
                    type: 'line',
                },
                 {
                    label: 'Scenario 2: 50th Percentile (Median)',
                    data: s2_p50,
                    borderColor: s2_median_color,
                    fill: false,
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
    
    // [MODIFIED] Detailed View Table for Monte Carlo
    function generateDetailsTable(birthYear, scenario1Data, scenario2Data) {
        tableContainer.innerHTML = ''; 
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Age</th>
                    <th>S1: Pension (Cumulative FV)</th>
                    <th>S2: 5th Percentile</th>
                    <th>S2: 50th (Median)</th>
                    <th>S2: 95th Percentile</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        
        for (let i = 0; i < scenario1Data.length; i++) {
            const year = scenario1Data[i].year;
            const age = year - birthYear;
            const s1_fv = scenario1Data[i].cumulativePayout;
            const s2_p5 = scenario2Data[i].p5;
            const s2_p50 = scenario2Data[i].p50;
            const s2_p95 = scenario2Data[i].p95;

            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${year}</td>
                <td>${age}</td>
                <td>$${s1_fv.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${s2_p5.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${s2_p50.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${s2_p95.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
                    pointRadius: d.pointRadius !== undefined ? d.pointRadius : 3,
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
                            // [BUG FIX] Removed 's' after '$'
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
                                if (label.includes('Percentile')) {
                                    if (label.includes('50th')) {
                                        // Keep median visible
                                    } else {
                                        label = ''; // Hide percentile band labels from tooltip
                                    }
                                }

                                if (label) {
                                    label += ': ';
                                    if (context.parsed.y !== null) {
                                        label += '$' + context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                    }
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
