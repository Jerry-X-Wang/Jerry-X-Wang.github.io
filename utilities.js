class Vector {

    constructor(...args) {
        this.x = [];
        for (let i = 0; i < args.length; i++) {
            this.x[i] = args[i];
        }
    }

    toString(prec=0) {
        let string = '(';
        if (prec == 0) {
            for (let i = 0; i < this.x.length; i++) {
                string += this.x[i] + ', ';
            }
        } else {
            for (let i = 0; i < this.x.length; i++) {
                string += this.x[i].toPrecision(prec) + ', ';
            }
        }
        string = string.slice(0, -2);
        string += ')';
        return string;
    }

    plus(vector) {
        const x = [];
        for (let i = 0; i < this.x.length; i++) {
            x.push(this.x[i] + vector.x[i]);
        }
        return new Vector(...x);
    }
    minus(vector) {
        const x = [];
        for (let i = 0; i < this.x.length; i++) {
            x.push(this.x[i] - vector.x[i]);
        }
        return new Vector(...x);
    }

    oppo() { // opposite vector
        const x = [];
        for (let i = 0; i < this.x.length; i++) {
            x.push(-this.x[i]);
        }
        return new Vector(...x);
    } 

    multi(scalar) {  // scalar multiplication
        const x = [];
        for (let i = 0; i < this.x.length; i++) {
            x.push(this.x[i] * scalar);   
        }
        return new Vector(...x);
    }

    norm() { // norm, or modulus, or length of vector
        let normSquare = 0;
        for (let i = 0; i < this.x.length; i++) {
            normSquare += this.x[i] ** 2;
        }
        return normSquare ** 0.5;
    }

    dot(vector) { // dot product
        let dotProduct = 0;
        for (let i = 0; i < this.x.length; i++) {
            dotProduct += this.x[i] * vector.x[i];   
        }
        return dotProduct;
    }

    unit() { // unit vector
        if (this.norm() === 0) {
            return new Vector(0, 0);
        } else {
            return this.multi(1/this.norm());
        }
    }

    project(vector) { // vector projection on another vector
        const unit = vector.unit();
        return unit.multi(this.dot(unit));
    }

}


function log(base, x) {
    return Math.log(x) / Math.log(base);
}

function mod(a, b){
    return ((a % b) + b) % b; // always returns a positive number
}

function floorToPrec(number, prec) {
    return Math.floor(number*10**prec) / 10**prec
}

function ceilToPrec(number, prec) {
    return Math.ceil(number*10**prec) / 10**prec
}


function uniqueArray(array) { // remove duplicates in array
    let seen = new Set();
    return array.filter(item => {
        let str = JSON.stringify(item);
        if (seen.has(str)) {
            return false;
        } else {
            seen.add(str);
            return true;
        }
    });
}

function permutationsOfArray(array, n = array.length) {
    const result = [];

    if (n == 0) {
        return [[]];
    } else {
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
}

function combinationsOfArray(array, n) {
    const result = [];

    function combine(tempArr, start) {
        if (tempArr.length === n) {
            result.push([...tempArr]);
            return;
        }

        for (let i = start; i < array.length; i++) {
            tempArr.push(array[i]);
            combine(tempArr, i + 1);
            tempArr.pop();
        }
    }

    combine([], 0);
    return result;
}

function productOfArrays(...arrays) { // cartesian product of arrays
    return uniqueArray(arrays.reduce((acc, curr) => 
        acc.flatMap(x => 
            curr.map(y => 
                [...x, y]
            )
        ), [[]]));
}

function powerOfArray(array, index) {
    if (index <= 0) {
        return [[]];
    }

    // generate index repeated arrays
    const repeatedArrays = Array.from({length: index}, () => array);

    return productOfArrays(...repeatedArrays);
}

function range(start, stop, step) {
    if (typeof stop === "undefined") {
        stop = start;
        start = 0;
    }
    if (typeof step === "undefined") {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }
    return result;
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (min <= max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        console.error("Invalid range for randomInt: min must be less than or equal to max.");
    }
}