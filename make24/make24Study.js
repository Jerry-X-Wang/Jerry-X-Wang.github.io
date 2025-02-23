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


const operators = ["+", "-", "*", "/"];
let numberCount;
let numbers;
let targets;


function main() {
    numberCount = parseInt(document.getElementById("numberCount").value);
    const randomStart = parseInt(document.getElementById("randomStart").value);
    const randomEnd = parseInt(document.getElementById("randomEnd").value);
    const targetStart = parseInt(document.getElementById("targetStart").value);
    const targetEnd = parseInt(document.getElementById("targetEnd").value);
    numbers = range(randomStart, randomEnd + 1);
    targets = range(targetStart, targetEnd + 1);
    
    document.getElementById("output").innerHTML = `
        Number Count: ${numberCount} <br>
        Random: ${randomStart} - ${randomEnd} <br>
        Target: ${targetStart} - ${targetEnd} <br>
    `;
    
    let i = 0;
    function nextTarget() {
        if (i == targets.length) {
            console.log("Done.");
            document.getElementById("output").innerHTML += "Done.";
        }
        if (i < targets.length) {
            probability(targets[i]);
            i++;
            setTimeout(nextTarget, 10); // use setTimeout to avoid stack overflow
        }
    }
    setTimeout(nextTarget, 50);
}

function probability(n) {
    const startTime = new Date().getTime();

    let numberArrays = powerOfArray(numbers, numberCount);

    // remove duplicates combinations
    numberArrays.forEach((array, i) => {
        numberArrays[i] = [array.sort((a, b) => a - b)];
    });
    numberArrays = uniqueArray(numberArrays)

    // set weight for each combination
    numberArrays.forEach((array, i) => {
        numberArrays[i].push(permutationsOfArray(array[0]).length);
    });

    // check whether each combination can make n
    numberArrays.forEach((array, i) => {
        if (withNumbersMakeN(array[0], n).length > 0) {
            numberArrays[i].push(true);
        } else {
            numberArrays[i].push(false);
        }
    }); 

    let satisfiedWeight = 0;
    let totalWeight = 0;

    // calculate the probability
    numberArrays.forEach(array => {
        totalWeight += array[1];
        if (array[2]) {
            satisfiedWeight += array[1];
        }
    });
    const probability = satisfiedWeight / totalWeight;

    console.log(`P(${n}) = ${satisfiedWeight}/${totalWeight} = ${probability.toFixed(4)}`);
    const output = `P(${n}) = ${satisfiedWeight}/${totalWeight} = ${probability.toFixed(4)} <br>`
    document.getElementById("output").innerHTML += output;

    const endTime = new Date().getTime();
    console.log(`Time elasped (${n}): ${(endTime - startTime) / 1000} s`);

    return probability;
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

function withNumbersMakeN(numbers, n) { // returns an array including Formula objects
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
    
    return uniqueArray(formulas);
}

document.getElementById("randomStart").addEventListener("input", (event) => {
    const randomStart = parseInt(event.target.value);
    const randomEnd = parseInt(document.getElementById("randomEnd").value);
    if (randomStart > randomEnd) {
        event.target.value = randomEnd;
    }
});

document.getElementById("randomEnd").addEventListener("input", (event) => {
    const randomEnd = parseInt(event.target.value);
    const randomStart = parseInt(document.getElementById("randomStart").value);
    if (randomEnd < randomStart) {
        event.target.value = randomStart;
    }
});

document.getElementById("targetStart").addEventListener("input", (event) => {
    const targetStart = parseInt(event.target.value);
    const targetEnd = parseInt(document.getElementById("targetEnd").value);
    if (targetStart > targetEnd) {
        event.target.value = targetEnd;
    }
});

document.getElementById("targetEnd").addEventListener("input", (event) => {
    const targetEnd = parseInt(event.target.value);
    const targetStart = parseInt(document.getElementById("targetStart").value);
    if (targetEnd < targetStart) {
        event.target.value = targetStart;
    }
});