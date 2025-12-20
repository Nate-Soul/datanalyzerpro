document.addEventListener("DOMContentLoaded", () => {
    const oneWayAnovaSection     = document.querySelector(".analysis-section.one-way-anova-section");
    const tTestSection           = document.querySelector(".analysis-section.t-test-section");
    const descriptiveStatSection = document.querySelector(".analysis-section.descriptive-stat-section");
    const summaryStatSection     = document.querySelector(".analysis-section.summary-stat-section");
    const sharePageBtn           = document.getElementById("sharePageBtn");

    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");

    if (!dataParam) {
        document.body.innerHTML = "<h1 style='text-align:center;margin-top:100px;'>No results data found.</h1>";
        return;
    }

    let payload;
    try {
        payload = JSON.parse(decodeURIComponent(dataParam));
    } catch (e) {
        console.error("Failed to parse results data:", e);
        document.body.innerHTML = "<h1 style='text-align:center;margin-top:100px;'>Invalid results data.</h1>";
        return;
    }

    // Header & Footer
    document.querySelector(".page-subtitle").textContent = 
        `Analysis completed on ${payload.date} at ${payload.time} • ${payload.datasetCount} datasets analyzed`;

    document.querySelector(".timestamp").innerHTML = 
        `<i class="fas fa-clock"></i> Last updated: ${payload.date} at ${payload.time}`;

    // === Summary Statistics Cards ===
    const grid = summaryStatSection.querySelector(".results-grid");
    grid.innerHTML = "";
    payload.datasets.forEach(ds => {
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
            <div class="dataset-label">${ds.label}</div>
            <div class="metric-item"><div class="metric-name">Mean</div><div class="metric-value">${ds.mean}</div></div>
            <div class="metric-item"><div class="metric-name">Std Dev</div><div class="metric-value">${ds.stdDev.toFixed(3)}</div></div>
            <div class="metric-item"><div class="metric-name">Sample Size</div><div class="metric-value">${ds.n}</div></div>
        `;
        grid.appendChild(card);
    });

    // === Descriptive Statistics Table ===
    const descTableBody = descriptiveStatSection.querySelector(".results-table tbody");
    descTableBody.innerHTML = "";
    payload.datasets.forEach(ds => {
        const values = ds.values;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
            : sorted[Math.floor(sorted.length/2)];

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${ds.label}</td>
            <td>${ds.mean}</td>
            <td>${median.toFixed(3)}</td>
            <td>${ds.stdDev.toFixed(3)}</td>
            <td>${Math.min(...values).toFixed(3)}</td>
            <td>${Math.max(...values).toFixed(3)}</td>
            <td>${(Math.max(...values) - Math.min(...values)).toFixed(3)}</td>
        `;
        descTableBody.appendChild(row);
    });

    // === T-Test Results ===
    if (payload.analyses.tTest && payload.datasetCount === 2) {
        const container = tTestSection.querySelector(".test-result-card");
        container.innerHTML = ""; // Clear placeholder structure

        const tValue = parseFloat(payload.analyses.tTest.t);
        const df = payload.datasets[0].n + payload.datasets[1].n - 2;
        const pValue = jstat.ttest(tValue, df, 2); // 2-sided

        const isSignificant = pValue < 0.05;
        container.className = `test-result-card ${isSignificant ? 'significant' : ''}`;

        const pDisplay = pValue < 0.0001 ? "< 0.0001" : pValue.toFixed(4);

        container.innerHTML = `
            <div class="test-name">${payload.analyses.tTest.comparison}</div>
            <div class="test-stats">
                <div class="stat-item"><span class="stat-label">t-statistic</span><span class="stat-value">${tValue.toFixed(3)}</span></div>
                <div class="stat-item"><span class="stat-label">p-value</span><span class="stat-value p-value ${isSignificant ? 'significant' : ''}">${pDisplay}</span></div>
                <div class="stat-item"><span class="stat-label">Degrees of Freedom</span><span class="stat-value">${df}</span></div>
                <div class="stat-item"><span class="stat-label">95% CI</span><span class="stat-value">Not implemented</span></div>
            </div>
            <div class="interpretation">
                <strong>Interpretation:</strong> 
                ${isSignificant 
                    ? `Statistically significant difference detected (p ${pValue < 0.001 ? '< 0.001' : `< ${pDisplay}`}).` 
                    : 'No statistically significant difference (p ≥ 0.05).'}
            </div>
        `;
        tTestSection.style.display = "block";
    } else {
        tTestSection.style.display = "none";
    }

    // === One-Way ANOVA Results ===
    if (payload.analyses.anovaOneWay) {
        const anova = payload.analyses.anovaOneWay;
        const card = oneWayAnovaSection.querySelector(".test-result-card");

        const F = parseFloat(anova.F);
        const dfBetween = anova.dfBetween;
        const dfWithin = anova.dfWithin;
        const pValue = jStat.anovaftest(...payload.datasets.map(ds => ds.values)); // Direct jstat call for accurate p

        const isSignificant = pValue < 0.05;
        card.className = `test-result-card ${isSignificant ? 'significant' : ''}`;

        const pDisplay = pValue < 0.0001 ? "< 0.0001" : pValue.toFixed(4);

        card.querySelector(".f-value").textContent = F.toFixed(3);
        card.querySelector(".p-value").innerHTML = pDisplay;
        card.querySelector(".p-value").className = `stat-value p-value ${isSignificant ? 'significant' : ''}`;
        card.querySelector(".between-groups-df").textContent = dfBetween;
        card.querySelector(".within-groups-df").textContent = dfWithin;

        card.querySelector(".interpretation").innerHTML = `
            <strong>Interpretation:</strong> 
            ${isSignificant 
                ? `There is a statistically significant difference between at least two groups (p ${pDisplay}). Post-hoc tests recommended.` 
                : 'No statistically significant difference between groups (p ≥ 0.05).'}
        `;

        // Populate full ANOVA table
        const anovaTableBody = oneWayAnovaSection.querySelector(".results-table tbody");
        anovaTableBody.innerHTML = `
            <tr>
                <td>Between Groups</td>
                <td>${anova.ssBetween}</td>
                <td>${anova.dfBetween}</td>
                <td>${anova.msBetween}</td>
                <td>${F.toFixed(3)}</td>
            </tr>
            <tr>
                <td>Within Groups</td>
                <td>${anova.ssWithin}</td>
                <td>${anova.dfWithin}</td>
                <td>${anova.msWithin}</td>
                <td>—</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>${anova.totalSS}</strong></td>
                <td><strong>${anova.totalDf}</strong></td>
                <td>—</td>
                <td>—</td>
            </tr>
        `;

        oneWayAnovaSection.style.display = "block";
    } else {
        oneWayAnovaSection.style.display = "none";
    }

    // Existing export/share/back functionality (unchanged)
    const exportPDFBtn = document.getElementById("exportPDFBtn");
    const exportCSVBtn = document.getElementById("exportCSVBtn");
    const exportXLSXBtn = document.getElementById("exportXLSXBtn");
    const backButtons = document.querySelectorAll(".analysis-back-button");

    [exportPDFBtn, exportCSVBtn, exportXLSXBtn].forEach((btn) => {
        btn.addEventListener("click", function () {
            const type = this.classList[1].toUpperCase();
            alert(`Exporting results as ${type}... (feature coming soon)`);
        });
    });

    sharePageBtn.addEventListener("click", async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Analysis Results - Statistical Data Analysis Tool",
                    text: "Check out these analysis results!",
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            alert("Your browser does not support native sharing.");
        }
    });

    backButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "./analyzer.html";
        });
    });

    document.querySelector(".ai-feature-card").addEventListener("click", () => {
        alert("AI feature coming soon! This will provide intelligent insights about your data.");
    });

    // Scroll shadow for export bar
    const exportBar = document.querySelector(".export-action-bar");
    window.addEventListener("scroll", () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        exportBar.style.boxShadow = scrollTop > 100 
            ? "0 4px 12px rgba(0, 0, 0, 0.12)" 
            : "0 2px 8px rgba(0, 0, 0, 0.06)";
    });
});