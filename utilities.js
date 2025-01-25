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
            return new Vector(this.x / this.norm(), this.y / this.norm());
        }
    }

    project(vector) { // vector projection on another vector
        const unit = vector.unit();
        return unit.multi(this.dot(unit));
    }

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

