let numberCount = 4;

window.onload = function() {
    for (let i = 0; i < numberCount; i++) {
        createInput();
        document.getElementById('numbers').lastChild.value = i + 1;
    }
};

// generate an input
function createInput() {
    const inputDiv = document.getElementById('numbers');
    const input = document.createElement('input');
    input.className = 'input';
    input.type = 'number';
    inputDiv.appendChild(input);
}

const operationCounts = 4;

function operate(x, y, operation) {
    switch (operation) {
        case 0: // add
            return x + y;
        case 1: // subtract
            return x - y;
        case 2: // multiply
            return x * y;
        case 3: // divide
            return x / y;
        default:
            console.error("Invalid operation");
            return NaN;
    }
}

function uniqueArray(array) { // remove duplicates in array
    return Array.from(new Set(array.map(JSON.stringify)), JSON.parse);
}

function permutationsOfArray(array, n = array.length) {
    const result = [];

    if (n == 0) {
        return [[]];
    }

    for (let i = 0; i < array.length; i++) {
        const current = array[i];
        const rest = array.slice(0, i).concat(array.slice(i + 1));
        const restPermutations = permutationsOfArray(rest, n - 1);

        for (let j = 0; j < restPermutations.length; j++) {
            result.push([current].concat(restPermutations[j]));
        }
    }

    return uniqueArray(result);
}

function powerOfArray(array, index) {
    if (index == 0) {
        return [[]];
    }

    if (index == 1) {
        return array.map(x => [x]);
    }

    const result = [];
    for (let i = 0; i < array.length; i++) {
        const current = array[i];
        const restPowers = powerOfArray(array, index - 1);

        for (let j = 0; j < restPowers.length; j++) {
            result.push([current].concat(restPowers[j]));
        }
    }

    return result;
}

function calculate(formula) { // formula = [numbers, operations, orders]
    const numbers = formula[0];
    const operations = formula[1];
    const orders = formula[2];
    if (numbers.length - 1 == operations.length && operations.length - 1 == orders.length) {
        if (numbers.length == 2) {
            return operate(numbers[0], numbers[1], operations[0]);
        }

        const formula = [numbers.slice(1), operations.slice(1), orders.slice(1)];
        if (orders[0] == 0) {
            return operate(
                calculate(formula), 
                numbers[0], 
                operations[0]
            );
        } else if (orders[0] == 1) {
            return operate(
                numbers[0], 
                calculate(formula), 
                operations[0]
            );
        } else {
            console.error("Invalid order");
        }
    } else {
        console.error("Invalid formula");
    }
}

function withNumbersMakeN(numbers, n) {
    const numberCount = numbers.length;
    let numbersTried = permutationsOfArray(numbers);

    let operations = [];
    for (i = 0; i < operationCounts; i++) {
        operations.push(i);
    }
    let operationsTried = powerOfArray(operations, numberCount - 1);

    let ordersTried = powerOfArray([0, 1], numberCount - 2); // 0 for argument x, 1 for argument y, in operate(x, y, operation)

    const formulas = [];

    numbersTried.forEach(numbers => {
        operationsTried.forEach(operations => {
            ordersTried.forEach(orders => {
                const formula = [numbers, operations, orders];
                result = calculate(formula);
                if (result == n) {
                    formulas.push(formula);
                }
            });
        });
    });
    
    return formulas;
}

function translateOperation(operation) {
    switch (operation) {
        case 0: // add
            return "+";
        case 1: // subtract
            return "-";
        case 2: // multiply
            return "×";
        case 3: // divide
            return "/";
        default:
            console.error("Invalid operation");
    }
}

function translateFormula(formula) {
    if (formula[0].length == 2) {
        return `(${formula[0][0]}`+ "\u2006" +
            `${translateOperation(formula[1][0])}`+ "\u2006" +
            `${formula[0][1]})`;
    }

    if (formula[2][0] == 0) {
        return `(${translateFormula([formula[0].slice(1), formula[1].slice(1), formula[2].slice(1)])}` + "\u2006" +
            `${translateOperation(formula[1][0])}` + "\u2006" +
            `${formula[0][0]})`;
    } else if (formula[2][0] == 1) {
        return `(${formula[0][0]}` + "\u2006" +
            `${translateOperation(formula[1][0])}` + "\u2006" +
            `${translateFormula([formula[0].slice(1), formula[1].slice(1), formula[2].slice(1)])})`;
    } else {
        console.error("Invalid order");
    }
}

function naturalizeFormula(formula) {
    return translateFormula(formula).slice(1, -1); // remove parentheses in the beginning and end
}

function randomNumbers() {
    const inputNumbers = document.getElementById('numbers').children;
    for (i = 0; i < inputNumbers.length; i++) {
        inputNumbers[i].value = Math.floor(Math.random() * 13) + 1;
    }
    document.getElementById("random").blur();
}

function confirmNumbers() {
    const inputNumbers = document.getElementById('numbers').children;
    const numbers = [];
    for (i = 0; i < inputNumbers.length; i++) {
        numbers.push(parseFloat(inputNumbers[i].value));
    }
    const n = parseFloat(document.getElementById('result').value);
    console.log(`Finding formulas with ${numbers} making ${n}`);
    const formulas = withNumbersMakeN(numbers, n);
    console.log(`Finished with ${formulas.length} formula(s) found`);
    const naturalFormulas = formulas.map(naturalizeFormula);

    let output
    if (formulas == "") {
        output = `${numbers} cannot make ${n}`;
    } else {
        output = `${formulas.length} formula(s) found <br>`
        naturalFormulas.forEach(formula => {
            output += formula + `\u2006=\u2006${n}<br>`;
        });
    }
    document.getElementById('output').innerHTML = output;
}


window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case "Enter":
            confirmNumbers();
            break;
    }
});