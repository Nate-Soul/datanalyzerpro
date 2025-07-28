const calculateMean = (values) => {
    return summation(values) / values.length;
};

const summation = (values)  => {
    return values.reduce((sum, value) => sum + parseFloat(value), 0);
};

const getSquareDifferences = (data, mean) => {
    return data.map(value => Math.pow(parseFloat(value) - mean, 2));
};

const calculateSD = (data, type = "population") => {
    //calculate the mean
    const mean = calculateMean(data);
    
    //calculate the sum of squared differences from the mean
    const squaredDifferences = getSquareDifferences(data, mean);
    const sumSquaredDiff     = summation(squaredDifferences);

    //calculate the variance
    const variance = type === "population" ? sumSquaredDiff / data.length : sumSquaredDiff / (data.length - 1);
    const standardDeviation = Math.sqrt(variance);
    return standardDeviation.toFixed(3);
};

const calculateTtest = (means, noOfItems, SDs) => {
    const meanDifference    = means[0] - means[1];
    const g                 = parseFloat(Math.sqrt((Math.pow(parseFloat(SDs[0]), 2)/noOfItems[0]) + (Math.pow(parseFloat(SDs[1]), 2)/noOfItems[1])));
    const calculatedTtest   = parseFloat(meanDifference/g).toFixed(3);
    return calculatedTtest;
};

const calculateOneWayAnova = (dataset = [], means, noOfItems) => {
    let totalItems = 0; // n
    let ssb = [];
    let ssw = [];

    const grandMean  = calculateMean(means);
    totalItems       = summation(noOfItems);
    const noOfGroups = dataset.length; // k

    const dfb       = parseInt(noOfGroups - 1); // n - k
    const dfw       = parseInt(totalItems - noOfGroups); // k - 1

    for (let index = 0; index < noOfItems.length; index++) {
        ssb.push(noOfItems[index] * Math.pow(means[index] - grandMean, 2));
        ssw.push(getSquareDifferences(dataset[index], means[index]));
    }
    
    const essb = summation(ssb); //summation of ssb
    const essw = summation(ssw.flat()); //summation of ssw
    
    const mssw = essw / dfw;
    const mssb = essb / dfb;

    const f = parseFloat(mssb/mssw).toFixed(2);
    // return {
    //     "F": f, 
    //     "ESSb": essb, 
    //     "ESSw": essw, 
    //     "DFb": dfb,
    //     "DFW": dfw, 
    //     "Grand Mean": grandMean,
    //     "Mean SSw": mssw,
    //     "Mean SSb": mssb,
    // };
    console.log("One way Anova", {
        "F": f, 
        "ESSb": essb, 
        "ESSw": essw, 
        "DFb": dfb,
        "DFW": dfw, 
        "Grand Mean": grandMean,
        "Mean SSw": mssw,
        "Mean SSb": mssb,
    });
};

const parseAndValidateFieldValues = (fieldValue) => {
    const rawValues = fieldValue.split(",");
    const parsed = rawValues.map(v => parseFloat(v.trim()));

    if (parsed.length < 3 || parsed.some(isNaN)) {
        return null; // indicates invalid
    }
    return parsed;
};

document.addEventListener("DOMContentLoaded", () => {
    const addDataFieldBtn   = document.querySelector("#createFieldBtn");
    const compareDataForm   = document.querySelector("#compareDataForm");
    const errorDisplay      = document.querySelector("#errorDisplay");
    const dataFields        = document.querySelectorAll(".data-field");
    const submitBtn         = document.querySelector("#compareDataBtn")
    const resultsDisplay    = document.querySelector("#results");
    const checkboxes        = document.querySelectorAll('input[name="analysisOptions[]"]');
 
    const displayResults = (results) => {
        resultsDisplay.innerHTML = `
            <p>Mean: ${results.mean.join(', ')}</p>
            <p>Standard Deviation (Sample): ${results.sampleSDs.join(', ')}</p>
            <p>Standard Deviation (Population): ${results.populationSDs.join(', ')}</p>
            <p>ANOVA F-value: ${results.anovaF || 'N/A'}</p>
            <p>T-Test: ${results.ttest || 'N/A'}</p>
        `;
    };

    const removeDataField = (id) => {
        const dataFieldElem = document.querySelector(`#${id}`);
        dataFieldElem.remove();
    };

    const toggleSubmitButton = (text, showLoader = false) => {
        submitBtn.childNodes[0].textContent = text;
        const loader = submitBtn.querySelector("img");
        loader.classList.toggle("d-block", showLoader);
        loader.classList.toggle("d-none", !showLoader);
    };

    const createNewDataField = () => {
        const uniqueId = Date.now();

        const newDataField = document.createElement("div");
        newDataField.id = `dataBox${uniqueId}`;
        newDataField.classList = "mb-3 form-floating data-field";

        const textarea      = document.createElement("textarea");
        textarea.name       = `field_${uniqueId}`;
        textarea.id         = `field${uniqueId}`;
        textarea.rows       = "5";
        textarea.required   = true;
        textarea.classList  = "form-control";

        const label = document.createElement("label");
        label.htmlFor = `field${uniqueId}`;
        label.textContent = `Dataset ${document.querySelectorAll(".data-field").length + 1}`;

        const removeBtn = document.createElement("button");
        removeBtn.classList = "btn rounded-circle";
        removeBtn.textContent = `x`
        removeBtn.addEventListener("click", () => removeDataField(`dataBox${uniqueId}`));
        
        newDataField.appendChild(textarea);
        newDataField.appendChild(label);
        newDataField.appendChild(removeBtn);

        compareDataForm.insertBefore(newDataField, addDataFieldBtn);
    };

    const compareData = (options) => {
        const dataFields    = document.querySelectorAll(".data-field");
        let dataset         = [];
        let means           = [];
        let populationSDs   = [];
        let sampleSDs       = [];
        let noOfItems       = [];


        dataFields.forEach(dataField => {
            const dataTextField = dataField.querySelector(".form-control");
            
            if (isValidField(dataTextField.id)) {
                // Get the values on each textarea field
                const fieldData = dataTextField.value.split(",").map(val => parseFloat(val));
                dataset.push(fieldData);
                noOfItems.push(fieldData.length);
                means.push(calculateMean(fieldData));
                populationSDs.push(calculateSD(fieldData));
                sampleSDs.push(calculateSD(fieldData, "sample"));
                
                // displayResults();
                resultsDisplay.classList.replace("d-none", "d-block");
                //change submit button text and remove loader
                toggleSubmitButton("Compare Data", false);
            } else {
                errorDisplay.textContent = "Please check your values and try again";
                document.querySelector("#results").classList.replace("d-block", "d-none");
                //change submit button text and remove loader
                toggleSubmitButton("Compare Data", false);
            }
        });

        
        const analysisFunctions = {
            mean: () => console.log("Means", means),
            sample: () => console.log("Sample Standard Deviations", sampleSDs),
            population: () => console.log("Population Standard Deviations", populationSDs),
            anova_one_way: () => {
                if (noOfItems.length < 2) {
                    console.log("At least 2 dataset to perform ANOVA");
                } else {
                    calculateOneWayAnova(dataset, means, noOfItems);
                }
            },
            anova_two_way: () => console.log(""),
            t_test: () => {
                if (noOfItems.length <= 1 || noOfItems.length > 2) {
                    console.log("At most 2 dataset is needed for T-test");
                } else {
                    console.log("T-test", calculateTtest(means, noOfItems, populationSDs));
                }          
            },
        };

        options.forEach((option) => {
            if (analysisFunctions[option]) {
                analysisFunctions[option]();
                displayResults()
            };
        });
    };
    
    const isValidField = (fieldId) => {
        const field = document.querySelector(`#${fieldId}`);

        if (!field) {
            errorDisplay.textContent = "Text fields were not found";
            return false;
        } else {
            const fieldValues = field.value.split(",");
            
            if(Array.isArray(fieldValues) && fieldValues.length > 2){
                for (let i = 0; i < fieldValues.length; i++) {
                    let fieldValue = parseFloat(fieldValues[i].trim());

                    if (isNaN(fieldValue)) {
                        errorDisplay.textContent = "Please enter numeric values separated by a comma and try again";
                        return false;
                    }
                }
            
            } else {
                errorDisplay.textContent = "Please provide at least 3 valid data samples in each text box to continue";
                return false;
            }
        }

        errorDisplay.textContent = "";
        return true;
    };
    
    const validateField = (event) => {
        isValidField(event.target.id);
    };
    
    const validateData = (field) => {
        const values = parseAndValidateFieldValues(field.value);
        if (!values) return { isValid: false, message: "Invalid format..." };
        return { isValid: true, values };
    };

    const getAnalysisOptions = () => {
        let selected = [];

        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                selected.push(checkbox.value);
            }
        });

        return selected;
    };

    dataFields.forEach(dataField => {
        dataField.querySelector(".form-control").addEventListener("blur", (e) => {
            validateField(e);
        });
    });
    
    addDataFieldBtn.addEventListener("click", (e) => {
        createNewDataField();
    });

    compareDataForm.addEventListener("submit", (e) => {
        e.preventDefault();
        //hide results
        document.querySelector("#results").classList.replace("d-block", "d-none");
        //change submit button text and show loader
        toggleSubmitButton("Compare Data", true);

        const options = getAnalysisOptions();

        if (options.length === 0) {
            errorDisplay.textContent = "Please select at least one analysis option to continue";
        } else {
            setTimeout(() => compareData(options), 2000);
        }
    });
});