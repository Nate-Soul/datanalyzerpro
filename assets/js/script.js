/**
 * Statistical Calculation Functions
 * This section contains pure functions responsible for statistical computations.
 * They do not interact with the DOM or global state.
 */

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
    if (!Array.isArray(values) || values.length === 0) {
        return 0; // Or throw an error, depending on desired behavior for empty input
    }
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
    if (!Array.isArray(data) || data.length === 0) {
        return "0.000"; // Or handle error appropriately
    }

    const mean = calculateMean(data);
    const squaredDifferences = getSquareDifferences(data, mean);
    const sumSquaredDiff = summation(squaredDifferences);

    let variance;
    if (type === "population") {
        variance = sumSquaredDiff / data.length;
    } else {
        variance = sumSquaredDiff / (data.length - 1);
    }

    const standardDeviation = Math.sqrt(variance);
    return standardDeviation.toFixed(3);
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
        // Handle invalid input for t-test
        console.error("T-test requires exactly two sets of means, number of items, and standard deviations.");
        return "N/A";
    }

    const meanDifference = means[0] - means[1];
    const pooledSD = Math.sqrt(
        (Math.pow(parseFloat(SDs[0]), 2) / noOfItems[0]) +
        (Math.pow(parseFloat(SDs[1]), 2) / noOfItems[1])
    );

    if (pooledSD === 0) {
        // Avoid division by zero
        return "Infinity";
    }

    const calculatedTtest = parseFloat(meanDifference / pooledSD).toFixed(3);
    return calculatedTtest;
};

/**
 * Calculates the One-Way ANOVA F-value and related statistics.
 * @param {Array<Array<number>>} dataset - An array of arrays, where each inner array is a group's data.
 * @param {Array<number>} means - An array of means for each group.
 * @param {Array<number>} noOfItems - An array of the number of items in each group.
 * @returns {Object} An object containing ANOVA results.
 */
const calculateOneWayAnova = (dataset = [], means, noOfItems) => {
    if (!dataset.length || !means.length || !noOfItems.length || dataset.length !== means.length || dataset.length !== noOfItems.length) {
        console.error("Invalid input for One-Way ANOVA. Ensure dataset, means, and noOfItems are properly provided and aligned.");
        return {};
    }

    let totalItems = summation(noOfItems); // N
    const noOfGroups = dataset.length; // k

    const grandMean = calculateMean(means); // Mean of group means
    const dfb = noOfGroups - 1; // Degrees of freedom between groups
    const dfw = totalItems - noOfGroups; // Degrees of freedom within groups

    let ssb = []; // Sum of squares between
    let ssw = []; // Sum of squares within

    for (let i = 0; i < noOfItems.length; i++) {
        ssb.push(noOfItems[i] * Math.pow(means[i] - grandMean, 2));
        ssw.push(getSquareDifferences(dataset[i], means[i]));
    }

    const essb = summation(ssb); // Total Sum of Squares Between
    const essw = summation(ssw.flat()); // Total Sum of Squares Within

    const mssb = essb / dfb; // Mean Square Between
    const mssw = essw / dfw; // Mean Square Within

    const f = parseFloat(mssb / mssw).toFixed(2);

    return {
        "F": f,
        "ESSb": essb,
        "ESSw": essw,
        "DFb": dfb,
        "DFW": dfw,
        "Grand Mean": grandMean,
        "Mean SSw": mssw,
        "Mean SSb": mssb,
    };
};

/**
 * Helper Functions
 * These functions support the main logic and often involve data parsing or validation.
 */

/**
 * Parses and validates a comma-separated string of numeric values.
 * @param {string} fieldValue - The string containing comma-separated values.
 * @returns {Array<number>|null} An array of parsed numbers if valid, otherwise null.
 */
const parseAndValidateFieldValues = (fieldValue) => {
    const rawValues = fieldValue.split(",");
    const parsed = rawValues.map(v => parseFloat(v.trim()));

    // Ensure there are at least 3 values and none of them are NaN
    if (parsed.length < 3 || parsed.some(isNaN)) {
        return null; // Indicates invalid input
    }
    return parsed;
};

/**
 * Validates a single data input field based on its content.
 * @param {string} fieldId - The ID of the textarea field to validate.
 * @param {HTMLElement} errorDisplayElement - The DOM element to display error messages.
 * @returns {boolean} True if the field is valid, false otherwise.
 */
const isValidField = (fieldId, errorDisplayElement) => {
    const field = document.querySelector(`#${fieldId}`);

    if (!field) {
        errorDisplayElement.textContent = "Text fields were not found.";
        return false;
    }

    const fieldValues = field.value.split(",").map(val => val.trim());

    if (!Array.isArray(fieldValues) || fieldValues.length < 3) {
        errorDisplayElement.textContent = "Please provide at least 3 valid data samples in each text box to continue.";
        return false;
    }

    for (let i = 0; i < fieldValues.length; i++) {
        let fieldValue = parseFloat(fieldValues[i]);
        if (isNaN(fieldValue)) {
            errorDisplayElement.textContent = "Please enter numeric values separated by a comma and try again.";
            return false;
        }
    }

    errorDisplayElement.textContent = ""; // Clear previous errors
    return true;
};

/**
 * DOM Manipulation and Event Handling
 * This section manages interactions with the HTML document, including creating/removing elements
 * and handling user events.
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Element References
    const addDataFieldBtn = document.querySelector("#createFieldBtn");
    const compareDataForm = document.querySelector("#compareDataForm");
    const errorDisplay = document.querySelector("#errorDisplay");
    const resultsDisplay = document.querySelector("#results");
    const submitBtn = document.querySelector("#compareDataBtn");
    const checkboxes = document.querySelectorAll('input[name="analysisOptions[]"]');

    /**
     * Updates the submit button's text and toggles a loading spinner.
     * @param {string} text - The text to display on the button.
     * @param {boolean} showLoader - Whether to show or hide the loader.
     */
    const toggleSubmitButton = (text, showLoader = false) => {
        // Ensure childNodes[0] exists before accessing textContent
        if (submitBtn.childNodes[0]) {
            submitBtn.childNodes[0].textContent = text;
        }
        const loader = submitBtn.querySelector("img");
        if (loader) {
            loader.classList.toggle("d-block", showLoader);
            loader.classList.toggle("d-none", !showLoader);
        }
    };

    /**
     * Displays the calculated results on the page.
     * @param {Object} results - An object containing the analysis results.
     */
    const displayResults = (results) => {
        resultsDisplay.innerHTML = `
            <h3>Analysis Results</h3>
            <p><strong>Means:</strong> ${results.mean ? results.mean.map(m => m.toFixed(3)).join(', ') : 'N/A'}</p>
            <p><strong>Standard Deviation (Sample):</strong> ${results.sampleSDs ? results.sampleSDs.join(', ') : 'N/A'}</p>
            <p><strong>Standard Deviation (Population):</strong> ${results.populationSDs ? results.populationSDs.join(', ') : 'N/A'}</p>
            <p><strong>ANOVA F-value:</strong> ${results.anovaF || 'N/A'}</p>
            <p><strong>T-Test:</strong> ${results.ttest || 'N/A'}</p>
        `;
        resultsDisplay.classList.replace("d-none", "d-block");
    };

    /**
     * Removes a data field from the form.
     * @param {string} id - The ID of the data field element to remove.
     */
    const removeDataField = (id) => {
        const dataFieldElem = document.querySelector(`#${id}`);
        if (dataFieldElem) {
            dataFieldElem.remove();
            // Re-label existing fields after removal
            document.querySelectorAll(".data-field label").forEach((label, index) => {
                label.textContent = `Dataset ${index + 1}`;
            });
        }
    };

    /**
     * Creates and appends a new data input field to the form.
     */
    const createNewDataField = () => {
        const uniqueId = Date.now();

        const newDataField = document.createElement("div");
        newDataField.id = `dataBox${uniqueId}`;
        newDataField.classList = "mb-3 form-floating data-field position-relative";

        const textarea = document.createElement("textarea");
        textarea.name = `field_${uniqueId}`;
        textarea.id = `field${uniqueId}`;
        textarea.rows = "5";
        textarea.required = true;
        textarea.classList = "form-control";
        textarea.placeholder = "Enter comma-separated numbers (e.g., 10, 12, 15)"; // Add placeholder

        const label = document.createElement("label");
        label.htmlFor = `field${uniqueId}`;
        // Update label dynamically based on existing fields
        label.textContent = `Dataset ${document.querySelectorAll(".data-field").length + 1}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button"; // Important for buttons not to submit forms
        removeBtn.classList = "btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 m-2";
        removeBtn.textContent = `x`;
        removeBtn.setAttribute("aria-label", "Remove dataset field");
        removeBtn.addEventListener("click", () => removeDataField(`dataBox${uniqueId}`));

        newDataField.appendChild(textarea);
        newDataField.appendChild(label);
        newDataField.appendChild(removeBtn);

        // Insert before the addDataFieldBtn for consistent placement
        compareDataForm.insertBefore(newDataField, addDataFieldBtn);

        // Attach blur event listener to the newly created textarea
        textarea.addEventListener("blur", (e) => {
            isValidField(e.target.id, errorDisplay);
        });
    };

    /**
     * Collects selected analysis options from checkboxes.
     * @returns {Array<string>} An array of selected analysis option values.
     */
    const getAnalysisOptions = () => {
        let selected = [];
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                selected.push(checkbox.value);
            }
        });
        return selected;
    };

    /**
     * Main function to compare data and perform selected analyses.
     * @param {Array<string>} options - An array of selected analysis options.
     */
    const compareData = (options) => {
        const dataFields = document.querySelectorAll(".data-field .form-control");
        let allDataValid = true;
        let dataset = [];
        let means = [];
        let populationSDs = [];
        let sampleSDs = [];
        let noOfItems = [];
        let analysisResults = {};

        dataFields.forEach(dataTextField => {
            // Validate each field individually
            if (!isValidField(dataTextField.id, errorDisplay)) {
                allDataValid = false;
                return; // Stop processing further fields if one is invalid
            }

            const fieldData = parseAndValidateFieldValues(dataTextField.value);
            if (fieldData === null) {
                allDataValid = false;
                errorDisplay.textContent = "Error parsing data. Please ensure all fields have valid comma-separated numbers.";
                return;
            }

            dataset.push(fieldData);
            noOfItems.push(fieldData.length);
            means.push(calculateMean(fieldData));
            populationSDs.push(calculateSD(fieldData));
            sampleSDs.push(calculateSD(fieldData, "sample"));
        });

        if (!allDataValid) {
            resultsDisplay.classList.replace("d-block", "d-none");
            toggleSubmitButton("Run Analysis", false);
            return;
        }

        // Store basic stats
        analysisResults.mean = means;
        analysisResults.sampleSDs = sampleSDs;
        analysisResults.populationSDs = populationSDs;

        // Execute selected analyses
        options.forEach((option) => {
            switch (option) {
                case "anova_one_way":
                    if (noOfItems.length < 2) {
                        console.warn("One-Way ANOVA requires at least 2 datasets.");
                        errorDisplay.textContent = "One-Way ANOVA requires at least 2 datasets to be entered.";
                    } else {
                        const anovaResult = calculateOneWayAnova(dataset, means, noOfItems);
                        analysisResults.anovaF = anovaResult.F;
                        console.log("One-Way ANOVA Results:", anovaResult);
                    }
                    break;
                case "t_test":
                    if (noOfItems.length !== 2) {
                        console.warn("T-test requires exactly 2 datasets.");
                        errorDisplay.textContent = "T-test requires exactly 2 datasets to be entered.";
                    } else {
                        const ttestResult = calculateTtest(means, noOfItems, populationSDs);
                        analysisResults.ttest = ttestResult;
                        console.log("T-test Result:", ttestResult);
                    }
                    break;
                // Add cases for other analysis options if needed
                default:
                    console.log(`No specific action for analysis option: ${option}`);
            }
        });

        displayResults(analysisResults);
        toggleSubmitButton("Run Analysis", false);
        errorDisplay.textContent = ""; // Clear any lingering errors if successful
    };

    // Initial event listeners for existing data fields
    document.querySelectorAll(".data-field .form-control").forEach(dataField => {
        dataField.addEventListener("blur", (e) => {
            isValidField(e.target.id, errorDisplay);
        });
    });

    // Event listeners for buttons and form submission
    addDataFieldBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent form submission if button is inside a form
        createNewDataField();
    });

    compareDataForm.addEventListener("submit", (e) => {
        e.preventDefault();
        resultsDisplay.classList.replace("d-block", "d-none"); // Hide previous results
        errorDisplay.textContent = ""; // Clear previous errors
        toggleSubmitButton("Running...", true); // Show loader

        const options = getAnalysisOptions();

        if (options.length === 0) {
            errorDisplay.textContent = "Please select at least one analysis option to continue.";
            toggleSubmitButton("Run Analysis", false);
            return;
        }

        // Use a short timeout to allow UI to update before heavy computation (optional but good for UX)
        setTimeout(() => compareData(options), 100);
    });
});