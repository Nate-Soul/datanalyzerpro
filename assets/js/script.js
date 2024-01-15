
//This function validates comma seperated values from the text fields
const isValidField = (fieldId) => {
    
    const field         = document.querySelector(`#${fieldId}`);
    const errorDisplay = document.querySelector("#errorDisplay");

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
}


const validateField = (event) => {
    isValidField(event.target.id);
};

//Function to calculate mean
const calculateMean = (values) => {
    const mean = values.reduce((sum, value) => sum + parseFloat(value), 0) / values.length;
    return mean;    
}

//Function to calculate standard deviation
const calculateSD = (data) => {
    //calculate the mean
    const mean = calculateMean(data);
    
    //calculate the sum of squared differences from the mean
    const squaredDifferences = data.map(value => Math.pow(parseFloat(value) - mean, 2));
    const sumSquaredDiff     = squaredDifferences.reduce((sum, value) => sum + value, 0);

    //check the standard deviation type
    const stdDeviationChoices = document.querySelectorAll("input[name='stdDeviationType']");
    let stdDeviationType;
    for (const stdDeviationChoice of stdDeviationChoices){
        if (stdDeviationChoice.checked) {
            stdDeviationType = stdDeviationChoice.value;
            break;
        }
    }
    //calculate the variance
    const variance = stdDeviationType === "population" ? sumSquaredDiff / data.length : sumSquaredDiff / data.length - 1;
    const standardDeviation = Math.sqrt(variance);
    return standardDeviation.toFixed(3);
};


const calculateTtest = (mean1, mean2, SD1, SD2, NoOfItems1, NoOfItems2) => {
    const meanDifference    = parseFloat(mean1 - mean2);
    const g                 = parseFloat(Math.sqrt((Math.pow(SD1, 2)/NoOfItems1) + (Math.pow(SD2, 2)/NoOfItems2)));
    const calculatedTtest   = parseFloat(meanDifference/g).toFixed(3);
    return calculatedTtest;
}

const displayResults = (mean1, mean2, SD1, SD2, tTest) => {
    document.querySelector("#mean1").innerHTML = mean1;
    document.querySelector("#mean2").innerHTML = mean2;
    document.querySelector("#sd1").innerHTML = SD1;
    document.querySelector("#sd2").innerHTML = SD2;
    document.querySelector("#tTest").innerHTML = tTest;
}

//Function that analyzes the data
const compareData = () => {
    const errorDisplay  = document.querySelector("#errorDisplay");
    const isValidField1 = isValidField("field1");
    const isValidField2 = isValidField("field2");

    if (isValidField1 && isValidField2) {
        //get the values on each textarea field
        const field1Data = document.querySelector("#field1").value.split(",").map(val => parseFloat(val));
        const field2Data = document.querySelector("#field2").value.split(",").map(val => parseFloat(val));
    
        //calculate the mean, standard deviation and T-test
        const calculatedMean1 = calculateMean(field1Data);
        const calculatedMean2 = calculateMean(field2Data);
        const calculatedSD1   = calculateSD(field1Data);
        const calculatedSD2   = calculateSD(field2Data);
        const calculatedTtest = calculateTtest(calculatedMean1, calculatedMean2, calculatedSD1, calculatedSD2, field1Data.length, field2Data.length);
        
        //display results
        displayResults(calculatedMean1, calculatedMean2, calculatedSD1, calculatedSD2, calculatedTtest);
        document.querySelector("#results").classList.replace("d-none", "d-block");
        //change submit button text and remove loader
        const nodes = document.querySelector("#compareDataBtn").childNodes[0].textContent = "Compare data";
        document.querySelector("#compareDataBtn img").classList.replace("d-block", "d-none");
    } else {
        errorDisplay.textContent = "Please check your values and try again";
        document.querySelector("#results").classList.replace("d-block", "d-none");
        //change submit button text and remove loader
        const nodes = document.querySelector("#compareDataBtn").childNodes[0].textContent = "Compare data";
        document.querySelector("#compareDataBtn img").classList.replace("d-block", "d-none");
    }
};



document.querySelector("#field1").addEventListener("blur", validateField);
document.querySelector("#field2").addEventListener("blur", validateField);
//On form submite, validate the form fields and show data or error if form fields return invalid values
document.querySelector("#compareDataForm").addEventListener("submit", (e) => {
    e.preventDefault();
    //hide results
    document.querySelector("#results").classList.replace("d-block", "d-none");
    //change submit button text and show loader
    document.querySelector("#compareDataBtn img").classList.replace("d-none", "d-block");
    const nodes = document.querySelector("#compareDataBtn").childNodes[0].textContent = "Comparing data";
    //calculate
    setTimeout(compareData, 2000);
});