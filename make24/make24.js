class Operation {
    constructor(index1, index2, operator) {
        this.index1 = index1;
        this.index2 = index2;
        this.operator = operator; // +, -, *, or /
    }

    naturalOperator() {
        switch (this.operator) {
            case "+":
                return "+";
            case "-":
                return "-";
            case "*":
                return "×";
            case "/":
                return "/";
            default:
            console.error("Invalid operator");
        }
    }
}

class Formula {
    constructor(numbers, operations) {
        this.numbers = numbers; // [num1, num2, ... , numN]; e.g. [1, 2, 3, 4]
        this.operations = operations; // [operation1, operation2, ... , operationN]; e.g. [Operation(0, 1, "+"), Operation(2, 1, "*"), Operation(1, 0, "-")]
        if (numbers.length - operations.length != 1) {
            console.error("Invalid formula: Count of operations should be 1 less than count of numbers")
        }
    }

    value() {
        // recursion
        if (this.numbers.length == 2) {
            return calculate(
                this.numbers[this.operations[0].index1], 
                this.numbers[this.operations[0].index2], 
                this.operations[0].operator
            );
        } else {
            // operate once and put the result inplace of number at index1, and DELETE number at index2
            const value = calculate(
                this.numbers[this.operations[0].index1], 
                this.numbers[this.operations[0].index2], 
                this.operations[0].operator
            );
            const restNumbers = this.numbers.slice();
            restNumbers[this.operations[0].index1] = value;
            restNumbers.splice(this.operations[0].index2, 1);
            const restOperations = this.operations.slice(1);
            return new Formula(restNumbers, restOperations).value();
        }
    }

    natural() {
        // recursion
        if (this.numbers.length == 2) {
            return `(${this.numbers[this.operations[0].index1]}\u2006` + 
                `${this.operations[0].naturalOperator()}\u2006` + 
                `${this.numbers[this.operations[0].index2]})`;
        } else {
            const natuaralized = `(${this.numbers[this.operations[0].index1]}\u2006` + 
                `${this.operations[0].naturalOperator()}\u2006` + 
                `${this.numbers[this.operations[0].index2]})`;
            const restNumbers = this.numbers.slice();
            restNumbers[this.operations[0].index1] = natuaralized;
            restNumbers.splice(this.operations[0].index2, 1);
            const restOperations = this.operations.slice(1);
            return new Formula(restNumbers, restOperations).natural();
        }
    }
}


let numberCount = document.getElementById("numberCount").value;
let randomRange = [
    document.getElementById("randomStart").value,
    document.getElementById("randomEnd").value
];
let commutative = document.getElementById("commutative").checked;
let enableMaxFormulas = document.getElementById("enableMaxFormulas").checked;
let maxFormulas = document.getElementById("maxFormulas").value;
const operators = ["+", "-", "*", "/"];
let calculating = false; // to prevent calculation when it is already in progress
let hidden = false; // whether the output is hidden


function calculate(x, y, operator) {
    switch (operator) {
        case "+":
            return x + y;
        case "-":
            return x - y;
        case "*":
            return x * y;
        case "/":
            return x / y;
        default:
            console.error("Invalid operator");
    }
}

// generate an input
function createInput() {
    const inputDiv = document.getElementById("numbers");
    const input = document.createElement("input");
    input.className = "input question-input";
    input.type = "number";
    inputDiv.appendChild(input);
}

function numbersMakeN(numbers, n, maxFormulas=Infinity) { // returns an array including Formula objects
    // enumerate all the formulas and find whether its value is n
    const numberCount = numbers.length;
    let operatorses = powerOfArray(operators, numberCount - 1); // operatorses is the plural of operators

    const answerFormulas = [];
    const naturalFormulas = [];

    let formulaCount = 0;

    for (let i = 0; i < operatorses.length; i++) { // try all possible operators
        const operators = operatorses[i];
        const orders = [];
        for (let j = 0; j < numberCount - 1; j++) {
            orders.push(productOfArrays(permutationsOfArray(range(numberCount - j), 2), [operators[j]]));
        }
        const operationses = productOfArrays(...orders); // operationses is the plural of operations
        for (let j = 0; j < operationses.length; j++) { // try all possible operations
            let operations = operationses[j];
            for (let k = 0; k < operations.length; k++) { 
                const operation = operations[k];
                const index1 = operation[0][0];
                const index2 = operation[0][1];
                const operator = operation[1];
                if (commutative && (operator == "+" || operator == "*") && index1 > index2) {
                    operations = null;
                    break;
                }
                operations[k] = new Operation(index1, index2, operator); // format the operations to fit the constructor of Formula
            }
            if (operations != null) {
                const formula = new Formula(numbers, operations);
                formulaCount++;
                if (formula.value() == n) {
                    answerFormulas.push(formula);
                    if (maxFormulas != Infinity) {
                        const naturalFormula = formula.natural()
                        if (!naturalFormulas.includes(naturalFormula)) {
                            naturalFormulas.push(naturalFormula);
                            if (naturalFormulas.length >= maxFormulas) {
                                return answerFormulas;
                            }
                        }
                    }
                }
            }
        }
    }
    
    return answerFormulas;
}

function confirmNumbers() {
    if (!calculating) {
        calculating = true;
        let startTime, endTime;

        startTime = performance.now();
        const inputNumbers = document.getElementById("numbers").children;
        const numbers = [];
        for (i = 0; i < inputNumbers.length; i++) {
            numbers.push(parseFloat(inputNumbers[i].value));
        }
        const n = parseFloat(document.getElementById("result").value);
        console.log(`Finding formulas with ${numbers} making ${n}...`);
        if (commutative) {
            console.log("Considering commutative laws")
        }

        let formulas;
        if (enableMaxFormulas) { // find all formulas with the given numbers making the given result
            formulas = numbersMakeN(numbers, n, maxFormulas); 
            console.log(`Max formulas: ${maxFormulas}`)
        } else {
            formulas = numbersMakeN(numbers, n); // no max formulas limit
        }
        
        endTime = performance.now();
        console.log(`Time elapsed - calculation: ${((endTime - startTime) / 1000).toFixed(4)} s`)
        
        // naturalize the formulas
        startTime = performance.now();
        const naturalFormulas = [];
        formulas.forEach((formula, i) => {
            const naturalFormula = formula.natural().slice(1, -1); // slice(1, -1) to remove the outer parentheses
            if (!naturalFormulas.includes(naturalFormula)) {
                naturalFormulas.push(naturalFormula);
            } else {
                formulas[i] = null; // remove duplicates
            }
        });
        formulas = formulas.filter(item => item !== null); // remove duplicates

        endTime = performance.now();
        console.log(`Time elapsed - naturalization: ${((endTime - startTime) / 1000).toFixed(4)} s`)

        console.log(`Done with ${formulas.length} formula(s) found`);

        // display the results
        startTime = performance.now();
        let output;
        if (formulas == "") {
            output = `${numbers} cannot make ${n}`;
        } else {
            if (enableMaxFormulas && naturalFormulas.length >= maxFormulas) {
                output = `${formulas.length} formula(s) found <br>(maybe existing more)<br>`
            } else {
                output = `${formulas.length} formula(s) found <br>`
            }
            naturalFormulas.forEach(formula => {
                output += formula + `\u2006=\u2006${n}<br>`;
            });
        }
        document.getElementById("output").innerHTML = output;
        hidden = false;
        document.getElementById("toggleHidden").innerHTML = "Hide";
        document.getElementById("toggleHidden").style.display = "block";
        document.getElementById("output").style.display = "block";
        document.getElementById("output").style.color = "#000";

        endTime = performance.now();
        console.log(`Time elapsed - display: ${((endTime - startTime) / 1000).toFixed(4)} s`);

        setTimeout(() => { // if do not use setTimeout, the calculating will not work
            calculating = false;
        }, 100);
    } else {
        console.log("Already calculating");
    }
}

function randomNumbers() {
    const inputNumbers = document.getElementById("numbers").children;
    for (i = 0; i < inputNumbers.length; i++) {
        inputNumbers[i].value = randomInt(...randomRange);
    }
    document.getElementById("random").blur();
    document.getElementById("output").innerHTML = "";
    document.getElementById("toggleHidden").style.display = "none";
}

function toggleHidden() {
    if (hidden) {
        hidden = false;
        document.getElementById("output").style.display = "block";
        document.getElementById("toggleHidden").innerHTML = "Hide";
    } else {
        hidden = true;
        document.getElementById("output").style.display = "none";
        document.getElementById("toggleHidden").innerHTML = "Show";
    }
}


document.getElementById("numbers").addEventListener("input", function() {
    document.getElementById("output").style.color = "#aaa";
});

document.getElementById("numberCount").addEventListener("input", (event) => {
    numberCount = parseInt(event.target.value);
    document.getElementById("output").style.color = "#aaa";
    document.getElementById("numbers").innerHTML = "";
    for (let i = 0; i < numberCount; i++) {
        createInput();
        document.getElementById("numbers").lastChild.value = i + 1;
    }
});

document.getElementById("randomStart").addEventListener("input", (event) => {
    const randomStart = parseInt(event.target.value);
    randomRange[0] = randomStart;
});

document.getElementById("randomEnd").addEventListener("input", (event) => {
    const randomEnd = parseInt(event.target.value);
    randomRange[1] = randomEnd;
});

document.getElementById("commutative").addEventListener("input", (event) => {
    commutative = event.target.checked;
});

document.getElementById("enableMaxFormulas").addEventListener("input", (event) => {
    enableMaxFormulas = event.target.checked;
});

document.getElementById("maxFormulas").addEventListener("input", (event) => {
    maxFormulas = parseInt(event.target.value);
});


window.onload = function() {
    for (let i = 0; i < numberCount; i++) {
        createInput();
        document.getElementById("numbers").lastChild.value = i + 1;
    }
};

window.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "Enter":
            confirmNumbers();
            break;
    }
});