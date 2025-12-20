/**
 * Calculates the summation of an array of numeric values.
 * @param {Array<number|string>} values - An array of numbers or strings that can be parsed to numbers.
 * @returns {number} The sum of the values.
 */
const summation = (values) => {
    return values.reduce((sum, value) => sum + parseFloat(value), 0);
};

/**
 * Calculates the mean (average) of an array of numeric values.
 * @param {Array<number|string>} values - An array of numbers or strings that can be parsed to numbers.
 * @returns {number} The mean of the values.
 */
const calculateMean = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return summation(values) / values.length;
};

/**
 * Calculates the squared differences of each data point from the mean.
 * @param {Array<number|string>} data - An array of numbers or strings that can be parsed to numbers.
 * @param {number} mean - The mean of the data.
 * @returns {Array<number>} An array of squared differences.
 */
const getSquareDifferences = (data, mean) => {
    return data.map(value => Math.pow(parseFloat(value) - mean, 2));
};

/**
 * Calculates the standard deviation of a dataset.
 * @param {Array<number|string>} data - An array of numbers or strings that can be parsed to numbers.
 * @param {"population"|"sample"} type - The type of standard deviation to calculate ("population" or "sample").
 * @returns {string} The standard deviation, formatted to 3 decimal places.
 */
const calculateSD = (data, type = "population") => {
    if (!Array.isArray(data) || data.length === 0) return "0.000";
    const mean = calculateMean(data);
    const squaredDiffs = getSquareDifferences(data, mean);
    const sumSquaredDiff = summation(squaredDiffs);
    const variance = type === "population" 
        ? sumSquaredDiff / data.length 
        : sumSquaredDiff / (data.length - 1);
    return Math.sqrt(variance).toFixed(3);
};

/**
 * Calculates the independent samples t-test.
 * @param {Array<number>} means - An array containing the means of two groups.
 * @param {Array<number>} noOfItems - An array containing the number of items in each of the two groups.
 * @param {Array<number>} SDs - An array containing the standard deviations of the two groups.
 * @returns {string} The calculated t-test value, formatted to 3 decimal places.
 */
const calculateTtest = (means, noOfItems, SDs) => {
    if (means.length !== 2 || noOfItems.length !== 2 || SDs.length !== 2) {
        return "N/A";
    }
    const meanDiff = means[0] - means[1];
    const pooledSD = Math.sqrt(
        (Math.pow(SDs[0], 2) / noOfItems[0]) +
        (Math.pow(SDs[1], 2) / noOfItems[1])
    );
    if (pooledSD === 0) return "Infinity";
    return (meanDiff / pooledSD).toFixed(3);
};

/**
 * Calculates the One-Way ANOVA F-value and related statistics.
 * @param {Array<Array<number>>} dataset - An array of arrays, where each inner array is a group's data.
 * @param {Array<number>} means - An array of means for each group.
 * @param {Array<number>} noOfItems - An array of the number of items in each group.
 * @returns {Object} An object containing ANOVA results.
 */
const calculateOneWayAnova = (dataset, means, noOfItems) => {
    if (dataset.length < 2 || dataset.length !== means.length || dataset.length !== noOfItems.length) {
        return { F: "N/A" };
    }
    const totalItems = summation(noOfItems);
    const noOfGroups = dataset.length;
    const grandMean = calculateMean(means);
    const dfb = noOfGroups - 1;
    const dfw = totalItems - noOfGroups;

    let ssb = [];
    let ssw = [];
    for (let i = 0; i < noOfGroups; i++) {
        ssb.push(noOfItems[i] * Math.pow(means[i] - grandMean, 2));
        ssw.push(getSquareDifferences(dataset[i], means[i]));
    }

    const essb = summation(ssb);
    const essw = summation(ssw.flat());
    const mssb = essb / dfb;
    const mssw = essw / dfw;
    const f = (mssw === 0) ? "Infinity" : (mssb / mssw).toFixed(2);

    return { 
        F: f,
        ESSb: essb.toFixed(3),   
        ESSw: essw.toFixed(3),
        MeanSSb: mssb.toFixed(3),
        MeanSSw: mssw.toFixed(3),
        DFb: dfb,
        DFW: dfw,
    };
};

// === New: Simple Two-Way ANOVA (Main Effects Only) ===
const calculateTwoWayAnova = (dataArrays, labeledDatasets) => {
    // Expect labels in format "LevelA-LevelB" e.g., "Control-DrugX", "Control-Placebo", "Treatment-DrugX"
    const labelPattern = /^(.+?)-(.+)$/;
    const factorALevels = new Set();
    const factorBLevels = new Set();
    const groupMap = {}; // "A-B" → data array

    for (let i = 0; i < labeledDatasets.length; i++) {
        const match = labeledDatasets[i].label.trim().match(labelPattern);
        if (!match) {
            return { error: "Two-Way ANOVA requires dataset labels in 'FactorA-FactorB' format (e.g., Control-DrugX)." };
        }
        const [_, a, b] = match;
        factorALevels.add(a);
        factorBLevels.add(b);
        groupMap[`${a}-${b}`] = dataArrays[i];
    }

    const A = Array.from(factorALevels);
    const B = Array.from(factorBLevels);
    if (A.length < 2 || B.length < 2) {
        return { error: "Two-Way ANOVA requires at least 2 levels for each factor." };
    }
    // Grand mean
    const allData = dataArrays.flat();
    const grandMean = calculateMean(allData);

    // Means for each cell, row (A), column (B)
    const cellMeans = {};
    const rowMeans = {};
    const colMeans = {};
    const rowN = {};
    const colN = {};

    let totalN = 0;

    A.forEach(a => {
        rowMeans[a] = [];
        rowN[a] = 0;
    });
    B.forEach(b => {
        colMeans[b] = [];
        colN[b] = 0;
    });

    for (const a of A) {
        for (const b of B) {
            const key = `${a}-${b}`;
            if (!groupMap[key]) {
                return { error: `Missing data for combination ${a}-${b}. All combinations must be present.` };
            }
            const data = groupMap[key];
            const mean = calculateMean(data);
            cellMeans[key] = mean;
            rowMeans[a].push(...data);
            colMeans[b].push(...data);
            totalN += data.length;
        }
    }

     // Compute row and column means
    Object.keys(rowMeans).forEach(a => rowMeans[a] = calculateMean(rowMeans[a]));
    Object.keys(colMeans).forEach(b => colMeans[b] = calculateMean(colMeans[b]));

    // SS calculations (main effects only)
    let SSA = 0, SSB = 0;
    const nPerCell = dataArrays[0].length; // Assume equal sample sizes for simplicity

    A.forEach(a => {
        const nA = nPerCell * B.length;
        SSA += nA * Math.pow(rowMeans[a] - grandMean, 2);
    });
    B.forEach(b => {
        const nB = nPerCell * A.length;
        SSB += nB * Math.pow(colMeans[b] - grandMean, 2);
    });

    // Degrees of freedom
    const dfA = A.length - 1;
    const dfB = B.length - 1;
    const dfError = totalN - A.length * B.length;
    
    // Within-group SS (error)
    let SSE = 0;
    Object.keys(cellMeans).forEach(key => {
        const [a, b] = key.split('-');
        const data = groupMap[key];
        const cellMean = cellMeans[key];
        SSE += getSquareDifferences(data, cellMean).reduce((s, v) => s + v, 0);
    });

    const MSA = SSA / dfA;
    const MSB = SSB / dfB;
    const MSE = SSE / dfError;

    const F_A = (MSE === 0) ? "Infinity" : (MSA / MSE).toFixed(3);
    const F_B = (MSE === 0) ? "Infinity" : (MSB / MSE).toFixed(3);

    return {
        factorA_F: F_A,
        factorB_F: F_B
    };
};

// === Helper Functions ===

/**
 * Parses and validates a comma-separated string of numeric values.
 * @param {string} fieldValue - The string containing comma-separated values.
 * @returns {Array<number>|null} An array of parsed numbers if valid, otherwise null.
 */
const parseAndValidateFieldValues = (fieldValue) => {
    const trimmed = fieldValue.trim();
    if (!trimmed) return null;
    const rawValues = trimmed.split(",");
    const parsed = rawValues.map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    return (parsed.length >= 3) ? parsed : null;
};

document.addEventListener("DOMContentLoaded", () => {    
    const datasetContainer = document.getElementById("dataset-fields-container");
    const addDatasetButton = document.getElementById("add-dataset");
    const fileUploadInput = document.getElementById("file-upload");
    const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
    const filePreview = document.getElementById("file-preview");
    const importedDatasetsList = document.getElementById("imported-datasets-list");
    const submitBtn = document.querySelector(".run-analysis-btn");
    const resultsDisplay = document.querySelector("#results");
    const errorDisplay = document.querySelector("#errorDisplay");
    
    if (!datasetContainer || !addDatasetButton || !fileUploadInput || !submitBtn || !resultsDisplay || !errorDisplay) {
        console.error("Essential DOM elements are missing.");
    }
    
    let datasetCount = 3;
    
    /**
     * Validates a single data input field based on its content.
     * @param {string} fieldId - The ID of the textarea field to validate.
     * @param {HTMLElement} textareaElement - The DOM element to display error messages.
     * @returns {boolean} True if the field is valid, false otherwise.
     */
    const validateDataset = (textareaElement, validationMessageId) => {
        const value = textareaElement.value.trim();
        const validationDiv = document.getElementById(validationMessageId);
        validationDiv.textContent = "";
        textareaElement.style.borderColor = "";
    
        if (value === "") {
            validationDiv.textContent = "Dataset cannot be empty.";
            textareaElement.style.borderColor = "#d64937";
            return false;
        }
    
        const parsed = parseAndValidateFieldValues(value);
        if (parsed === null) {
            validationDiv.textContent = "Please provide at least 3 valid numeric values, comma-separated.";
            textareaElement.style.borderColor = "#d64937";
            return false;
        }
    
        textareaElement.style.borderColor = "#e0e4e8";
        return true;
    };
    
    const toggleSubmitButton = (text, showLoader = false) => {
        if (submitBtn.childNodes[0]) {
            submitBtn.childNodes[0].textContent = text;
        }
        const loader = submitBtn.querySelector("img");
        if (loader) {
            loader.style.display = showLoader ? "inline-block" : "none";
        }
    };
    
    // === UI: Create Dataset Row ===
    const createDatasetRow = (id) => {
        const row = document.createElement("div");
        row.classList.add("dataset-field-row");
        row.setAttribute("data-id", id);
    
        row.innerHTML = `
            <div class="form-group dataset-label-input">
                <label for="dataset-label-${id}">Dataset ${id} Label</label>
                <input type="text" id="dataset-label-${id}" class="input-field" 
                       placeholder="e.g., Control Group" value="Dataset ${id}" />
            </div>
            <div class="form-group dataset-value-input">
                <label for="dataset-values-${id}">Comma-separated values</label>
                <textarea id="dataset-values-${id}" class="input-field" 
                          placeholder="e.g., 10, 12, 15, 11, 13"></textarea>
                <div id="validation-${id}" class="validation-message"></div>
            </div>
            <button type="button" class="remove-dataset-btn" data-id="${id}" 
                    aria-label="Remove Dataset ${id}">
                <i class="fas fa-times"></i>
            </button>
        `;
    
        // Remove button
        row.querySelector(".remove-dataset-btn").addEventListener("click", () => {
            row.remove();
            if (datasetContainer.children.length === 0) {
                datasetCount++;
                const newRow = createDatasetRow(datasetCount);
                newRow.querySelector(".remove-dataset-btn").remove(); // Disable remove on last
                datasetContainer.appendChild(newRow);
            }
        });
    
        // Real-time validation
        const textarea = row.querySelector(`#dataset-values-${id}`);
        textarea.addEventListener("input", () => validateDataset(textarea, `validation-${id}`));
    
        return row;
    };
    
    // === Event Listeners ===
    addDatasetButton.addEventListener("click", () => {
        datasetCount++;
        const newRow = createDatasetRow(datasetCount);
        datasetContainer.appendChild(newRow);
        newRow.querySelector(".dataset-label-input input").focus();
    });
    
    // Delegated remove (covers dynamic rows)
    datasetContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-dataset-btn");
        if (btn) {
            const id = btn.dataset.id;
            const row = datasetContainer.querySelector(`.dataset-field-row[data-id="${id}"]`);
            if (row) row.remove();
            if (datasetContainer.children.length === 0) {
                datasetCount++;
                const newRow = createDatasetRow(datasetCount);
                newRow.querySelector(".remove-dataset-btn").remove();
                datasetContainer.appendChild(newRow);
            }
        }
    });
    
    // File upload simulation
    fileUploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
    
        if (!file) {
            filePreview.style.display = "none";
            importedDatasetsList.innerHTML = "";
        }
    
        const fileType = file.name.split(".").pop().toLowerCase();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            let datasets = []; 
            
            if (fileType === "csv") {
                const results = Papa.parse(e.target.result, {
                    header: true,
                    dynamicTyping: true, // Auto-convert to numbers
                    skipEmptyLines: true
                });
    
                if (results.errors.length > 0) {
                    alert("CSV parsing errors: " + results.errors.map(err => err.message).join(", "));
                    return;
                }
    
                // Transpose to columns as datasets
                const fields = results.meta.fields;
                datasets = fields.map(field => ({
                    label: field,
                    values: results.data.map(row => row[field]).filter(v => typeof v === "number" && !isNaN(v)) // Numeric only
                })).filter(ds => ds.values.length >= 3); // Min 3 values per your validation
            } else if (fileType === "xlsx" || fileType === "xls") {
                console.log("Parsing Excel file...");
                
                const workbook = XLSX.read(e.target.result, { type: "binary" });
                const firstSheet = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheet];
                
                // Convert to array of arrays (rows)
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }); // raw: false for type conversion
    
                if (data.length < 2) {
                    alert("XLSX file has insufficient data.");
                    return;
                }
                
                // Transpose columns
                const headers = data[0];
                datasets = headers.map((header, colIndex) => ({
                    label: header,
                    values: data.slice(1).map(row => parseFloat(row[colIndex])).filter(v => !isNaN(v))
                })).filter(ds => ds.values.length >= 3);
            } else {
                alert("Unsupported file type. Please upload CSV or XLSX.");
                filePreview.style.display = "block";
                importedDatasetsList.innerHTML = `
                    <li><strong>File:</strong> ${file.name}</li>
                    <li><em style="color: red;">Unsupported file type. Please upload CSV or XLSX.</em></li>
                `;
                return;
            }
    
            // Preview and add to UI
            filePreview.style.display = "block";
            importedDatasetsList.innerHTML = `<li><strong>File:</strong> ${file.name}</li>`;
            if (datasets.length === 0) {
                importedDatasetsList.innerHTML += `<li><em>No valid numeric datasets found (need at least 3 values per column).</em></li>`;
                return;
            }
    
            // Clear existing datasets and add new ones
            datasetContainer.innerHTML = "";
            datasetCount = 0;
            datasets.forEach(ds => {
                datasetCount++;
                const row = createDatasetRow(datasetCount);
                row.querySelector(".dataset-label-input input").value = ds.label;
                row.querySelector(".dataset-value-input textarea").value = ds.values.join(", ");
                datasetContainer.appendChild(row);
                validateDataset(row.querySelector("textarea"), `validation-${datasetCount}`);
            });
    
            // Ensure at least one row
            if (datasetContainer.children.length === 0) {
                datasetCount = 1;
                const firstRow = createDatasetRow(1);
                firstRow.querySelector(".remove-dataset-btn").remove();
                datasetContainer.appendChild(firstRow);
            }
    
            importedDatasetsList.innerHTML += `<li><em>Imported ${datasets.length} datasets from columns.</em></li>`;
        };
        
        if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
            reader.readAsBinaryString(file); // For SheetJS; PapaParse can use text
        } else {
            alert("Unsupported file type.");
        }
    });
    
    fileUploadWrapper.addEventListener("click", () => fileUploadInput.click());
    fileUploadWrapper.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileUploadInput.click();
        }
    });
    ["dragover", "dragleave", "drop"].forEach(event => {
        fileUploadWrapper.addEventListener(event, (e) => {
            e.preventDefault();
            if (event === "dragover") {
                fileUploadWrapper.style.borderColor = "#5998d6";
                fileUploadWrapper.style.backgroundColor = "rgba(89, 152, 214, 0.05)";
            } else {
                fileUploadWrapper.style.borderColor = "#e0e4e8";
                fileUploadWrapper.style.backgroundColor = "transparent";
            }
            if (event === "drop") {
                fileUploadInput.files = e.dataTransfer.files;
                fileUploadInput.dispatchEvent(new Event("change"));
            }
        });
    });
    
    // === Enhanced Analysis Execution ===
    const performAnalyses = (
        fullDataArrays, 
        means, 
        sampleSDs, 
        populationSDs, 
        noOfItems, 
        selectedOptions,
        datasets
    ) => {
        const results = {};
    
        selectedOptions.forEach(option => {
            switch (option) {
                case "mean":
                    results.mean = means.map(m => m.toFixed(3));
                    break;
    
                case "sample-std-dev":
                    results.sampleSDs = sampleSDs.map(s => parseFloat(s))
                    break;
    
                case "population-std-dev":
                    results.populationSDs = populationSDs.map(p => parseFloat(p));
                    break;
    
                case "t-test":
                    if (fullDataArrays.length !== 2) {
                        results.ttest = "N/A (requires exactly 2 datasets)";
                        errorDisplay.textContent = "T-Test requires exactly 2 datasets.";
                    } else {
                        results.ttest = calculateTtest(means, noOfItems, populationSDs.map(p => parseFloat(p)));
                        errorDisplay.textContent = "";
                    }
                    break;
    
                case "anova-one-way":
                    if (fullDataArrays.length < 2) {
                        results.anovaOneWay = "N/A (requires 2+ datasets)";
                        errorDisplay.textContent = "One-Way ANOVA requires at least 2 datasets.";
                    } else {
                        const anovaFull = calculateOneWayAnova(fullDataArrays, means, noOfItems);
                        results.anovaOneWay = {
                            F: anovaFull.F,
                            ssBetween: anovaFull.ESSb,
                            ssWithin: anovaFull.ESSw,
                            msBetween: anovaFull.MeanSSb,
                            msWithin: anovaFull.MeanSSw,
                            dfBetween: anovaFull.DFb,
                            dfWithin: anovaFull.DFW,
                            totalSS: parseFloat(anovaFull.ESSb + anovaFull.ESSw).toFixed(3),
                            totalDf: anovaFull.DFb + anovaFull.DFW
                        };
                        errorDisplay.textContent = "";
                    }
                    break;
    
                case "anova-two-way":
                    // Simple two-way ANOVA (main effects only)
                    const twoWayResult = calculateTwoWayAnova(fullDataArrays, datasets); // datasets has labels
                    if (twoWayResult.error) {
                        results.anovaTwoWay = twoWayResult.error;
                        errorDisplay.textContent = twoWayResult.error;
                    } else {
                        results.anovaTwoWay = {
                            factorA_F: twoWayResult.factorA_F,
                            factorB_F: twoWayResult.factorB_F,
                            // interaction not implemented yet
                        };
                        errorDisplay.textContent = "";
                    }
                    break;
    
                default:
                    console.log(`Unknown analysis option: ${option}`);
            }
        });
    
        return results;
    };

    const textareas = datasetContainer.querySelectorAll(".dataset-value-input textarea");
    if (textareas && textareas.length > 0) {
        textareas.forEach((textarea) => {
            const id = textarea.id.split("-").pop();
            // textarea.addEventListener("blur", () => validateDataset(textarea, `validation-${id}`));
            textarea.addEventListener("input", () => validateDataset(textarea, `validation-${id}`));
        });
    }
    
    // === Submit & Analysis ===
    submitBtn.addEventListener("click", () => {
        let allValid = true;
        const datasets = []; // { label, values[] }
        const fullDataArrays = []; // For ANOVA: [[values...], ...]
    
        document.querySelectorAll(".dataset-field-row").forEach((row) => {
            const id = row.dataset.id;
            const labelInput = row.querySelector(`#dataset-label-${id}`);
            const textarea = row.querySelector(`#dataset-values-${id}`);
    
            if (!validateDataset(textarea, `validation-${id}`)) {
                allValid = false;
                return;
            }
    
            const parsed = parseAndValidateFieldValues(textarea.value);
            if (parsed) {
                datasets.push({
                    label: labelInput.value.trim() || `Dataset ${id}`,
                    values: parsed
                });
                fullDataArrays.push(parsed);
            }
        });
    
        const selectedOptions = Array.from(
            document.querySelectorAll(".analysis-options-grid input[type='checkbox']:checked")
        ).map(cb => cb.value);
    
        if (!allValid || datasets.length === 0) {
            errorDisplay.textContent = "Please fix the errors in the datasets to continue.";
            toggleSubmitButton("Run Analysis", false);
            return;
        }
    
        if (selectedOptions.length === 0) {
            errorDisplay.textContent = "Please select at least one analysis option.";
            toggleSubmitButton("Run Analysis", false);
            return;
        }
    
        toggleSubmitButton("Running Analysis...", true);
        errorDisplay.textContent = "";
        resultsDisplay.style.display = "none";
    
        setTimeout(() => {
            // Compute stats
            const means = datasets.map(d => calculateMean(d.values));
            const populationSDs = datasets.map(d => calculateSD(d.values, "population"));
            const sampleSDs = datasets.map(d => calculateSD(d.values, "sample"));
            const noOfItems = datasets.map(d => d.values.length);
    
            const analysisResults = performAnalyses(
                fullDataArrays,
                means,
                sampleSDs,
                populationSDs,
                noOfItems,
                selectedOptions,
                datasets
            );
    
            // === Prepare data to send to results page ===
            const resultsPayload = {
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                datasetCount: datasets.length,
                datasets: datasets.map(ds => ({
                    label: ds.label,
                    values: ds.values,
                    mean: calculateMean(ds.values).toFixed(3),
                    stdDev: parseFloat(calculateSD(ds.values, "sample")), // using sample SD
                    n: ds.values.length
                })),
                summaryStats: {
                    means: means.map(m => parseFloat(m.toFixed(3))),
                    sampleSDs: sampleSDs.map(s => parseFloat(s)),
                    populationSDs: populationSDs.map(p => parseFloat(p))
                },
                analyses: {}
            };
    
            // Add selected analyses
            selectedOptions.forEach(option => {
                switch (option) {
                    case "t-test":
                        if (datasets.length === 2) {
                            resultsPayload.analyses.tTest = {
                                t: analysisResults.ttest,
                                // We'll calculate p-value and CI in results.js if needed
                                comparison: `${datasets[0].label} vs ${datasets[1].label}`
                            };
                        }
                        break;
                    case "anova-one-way":
                        if (datasets.length >= 2) {
                            resultsPayload.analyses.anovaOneWay = analysisResults.anovaOneWay;
                            // Full table will be computed in results.js
                        }
                        break;
                    case "anova-two-way":
                        if (analysisResults.anovaTwoWay && typeof analysisResults.anovaTwoWay !== 'string') {
                            resultsPayload.analyses.anovaTwoWay = analysisResults.anovaTwoWay;
                        }
                        break;
                }
            });
    
            // Encode and open results page
            const jsonString = JSON.stringify(resultsPayload);
            const encoded = encodeURIComponent(jsonString);
            window.open(`results.html?data=${encoded}`, '_blank');
    
            // displayResults(analysisResults);
            toggleSubmitButton("Run Analysis", false);
        }, 300); // Small delay for UX
    });
    
    // Initialize: If no rows exist on load, create first one (optional fallback)
    if (datasetContainer.children.length === 0) {
        datasetContainer.appendChild(createDatasetRow(1));
        datasetContainer.querySelector(".remove-dataset-btn")?.remove();
    }
});