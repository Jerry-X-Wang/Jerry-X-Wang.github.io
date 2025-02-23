class Vector { // 2d vector

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString(prec=0) {
        if (prec == 0) {
            return `(${this.x}, ${this.y})`;
        } else {
            return `(${this.x.toPrecision(prec)}, ${this.y.toPrecision(prec)})`;
        }
    }

    plus(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    minus(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    oppo() { // opposite vector
        return new Vector(-this.x, -this.y);
    } 

    multi(scalar) {  // scalar multiplication
        return new Vector(this.x * scalar, this.y * scalar);
    }

    norm() { // norm, or modulus, or length of vector
        return (this.x ** 2 + this.y ** 2) ** 0.5;
    }

    dot(vector) { // dot product
        return this.x * vector.x + this.y * vector.y;
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