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
        if (this.numbers.length == 2) {
            return calculate(
                this.numbers[this.operations[0].index1], 
                this.numbers[this.operations[0].index2], 
                this.operations[0].operator
            );
        } else {
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

function withNumbersMakeN(numbers, n) { // returns a Formula object
    // enumerate all the formulas and find whether its value is n
    const numberCount = numbers.length;
    let operatorsTried = powerOfArray(operators, numberCount - 1);

    const formulas = [];

    let formulaCount = 0;

    operatorsTried.forEach(operators => { // try all possible operators
        const orders = [];
        for (let i = 0; i < numberCount - 1; i++) {
            orders.push(productOfArrays(permutationsOfArray(range(numberCount - i), 2), [operators[i]]));
        }
        const operationses = productOfArrays(...orders); // operationses is the plural of operations
        operationses.forEach(operations => { 
            operations.forEach((operation, i) => { // try all possible operations
                operations[i] = new Operation(operation[0][0], operation[0][1], operation[1]); // format the operations to fit the constructor of Formula
            });
            const formula = new Formula(numbers, operations);
            formulaCount++;
            if (formula.value() == n) {
                formulas.push(formula);
            }
        });
    });
    
    console.log(`Tried ${formulaCount} formula(s)`);
    return uniqueArray(formulas);
}

function confirmNumbers() {
    if (!calculating) {
        calculating = true;
        const inputNumbers = document.getElementById("numbers").children;
        const numbers = [];
        for (i = 0; i < inputNumbers.length; i++) {
            numbers.push(parseFloat(inputNumbers[i].value));
        }
        const n = parseFloat(document.getElementById("result").value);
        console.log(`Finding formulas with ${numbers} making ${n}`);
        let formulas = withNumbersMakeN(numbers, n);
        
        // naturalize the formulas
        const naturalFormulas = [];
        formulas.forEach((formula, i) => {
            const naturalFormula = formula.natural().slice(1, -1); // slice(1, -1) to remove the outer parentheses
            if (!naturalFormulas.includes(naturalFormula)) {
                naturalFormulas.push(naturalFormula);
            } else {
                formulas[i] = undefined; // remove duplicates
            }
        });
        formulas = formulas.filter(item => item !== undefined); // remove duplicates

        console.log(`Done with ${formulas.length} formula(s) found`);

        let output;
        if (formulas == "") {
            output = `${numbers} cannot make ${n}`;
        } else {
            output = `${formulas.length} formula(s) found <br>`
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


let numberCount = document.getElementById("numberCount").value;
let randomRange = [
    document.getElementById("randomStart").value,
    document.getElementById("randomEnd").value
]
const operators = ["+", "-", "*", "/"];
let calculating = false; // to prevent calculation when it is already in progress
let hidden = false; // whether the output is hidden


document.getElementById("numberCount").addEventListener("input", (event) => {
    numberCount = parseInt(event.target.value);
    document.getElementById("numbers").innerHTML = "";
    for (let i = 0; i < numberCount; i++) {
        createInput();
        document.getElementById("numbers").lastChild.value = i + 1;
    }
});

document.getElementById("randomStart").addEventListener("input", (event) => {
    const randomStart = parseInt(event.target.value);
    if (randomStart <= randomRange[1]) {
        randomRange[0] = randomStart;
    } else {
        event.target.value = randomRange[0];
    }
});

document.getElementById("randomEnd").addEventListener("input", (event) => {
    const randomEnd = parseInt(event.target.value);
    if (randomEnd >= randomRange[0]) {
        randomRange[1] = randomEnd;
    } else {
        event.target.value = randomRange[1];
    }
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

document.getElementById("numbers").addEventListener("input", function() {
    document.getElementById("output").style.color = "#aaa";
});