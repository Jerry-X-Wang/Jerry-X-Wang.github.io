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
let results;


function main() {
    numberCount = parseInt(document.getElementById("numberCount").value);
    const numberStart = parseInt(document.getElementById("numberStart").value);
    const numberEnd = parseInt(document.getElementById("numberEnd").value);
    const resultStart = parseInt(document.getElementById("resultStart").value);
    const resultEnd = parseInt(document.getElementById("resultEnd").value);
    numbers = range(numberStart, numberEnd + 1);
    results = range(resultStart, resultEnd + 1);
    
    document.getElementById("output").innerHTML = `
        Number Count: ${numberCount} <br>
        Number: ${numberStart} - ${numberEnd} <br>
        Result: ${resultStart} - ${resultEnd} <br>
    `;
    
    let i = 0;
    function nextResult() {
        if (i == results.length) {
            console.log("Done.");
            document.getElementById("output").innerHTML += "Done.";
        }
        if (i < results.length) {
            probability(results[i]);
            i++;
            setTimeout(nextResult, 10); // use setTimeout to avoid stack overflow
        }
    }
    setTimeout(nextResult, 50);
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
        numberArrays[i].push(canNumbersMakeN(array[0], n))
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

function canNumbersMakeN(numbers, n) {
    // enumerate all the formulas and find whether there exist a formula whose value is n
    const numberCount = numbers.length;
    let operatorses = powerOfArray(operators, numberCount - 1); // operatorses is the plural of operators

    for (let i = 0; i < operatorses.length; i++) { // try all possible operators
        const operators = operatorses[i];
        const orders = [];
        for (let j = 0; j < numberCount - 1; j++) {
            orders.push(productOfArrays(permutationsOfArray(range(numberCount - j), 2), [operators[j]]));
        }
        const operationses = productOfArrays(...orders); // operationses is the plural of operations
        for (let j = 0; j < operationses.length; j++) {
            const operations = operationses[j];
            for (let k = 0; k < operations.length; k++) { // try all possible operations
                const operation = operations[k];
                const index1 = operation[0][0];
                const index2 = operation[0][1];
                const operator = operation[1];
                operations[k] = new Operation(index1, index2, operator); // format the operations to fit the constructor of Formula
            }
            const formula = new Formula(numbers, operations);
            if (formula.value() == n) {
                return true;
            }
        }
    }
    
    return false;
}