class Ball {

    constructor(m=1, r=10, colour="red", pos=new Vector(0, 0), v=new Vector(0, 0), F=new Vector(0, 0)) {
        this.m = m; // mass
        this.r = r; // radius
        this.colour = colour;
        this.pos = pos; // position
        this.v = v; // velocity
        this.F = F; // force applied
        this.a = F.multi(1/m); // acceleration
    }

    draw() {
        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        context.fillStyle = this.colour;
        context.fill();
        context.closePath();
    }

    move() {
        // check whether the ball is out of the canvas
        let overBound = 0;
        if ((this.pos.x > canvas.width - this.r)) {
            overBound = this.pos.x - (canvas.width - this.r);
            this.F.x = this.F.x - k * overBound;
        } else if (this.pos.x < this.r) {
            overBound = this.pos.x - this.r;
            this.F.x = this.F.x - k * overBound;
        }
        if ((this.pos.y > canvas.height - this.r)) {
            overBound = this.pos.y - (canvas.height - this.r);
            this.F.y = this.F.y - k * overBound;
        } else if (this.pos.y < this.r) {
            overBound = this.pos.y - this.r;
            this.F.y = this.F.y - k * overBound;
        }

        Ep_elastic += 1/2 * k * overBound ** 2; // E = 1/2 * k * x^2

        // apply gravity
        if (gravityOn) {
            this.F = this.F.plus(g.multi(this.m)); // F += m * g
            Ep_gravity += this.m * g.norm() * (new Vector(canvas.width/2, canvas.height/2).minus(this.pos).dot(g)/g.norm()); // E = m * g * h
        }

        if (airOn) {
            const d = this.r * 2; // diameter
            const scalarV = this.v.norm();
            const scalarF = airResistanceConstant * d * this.v.norm() ** 2; // scalar F = c * d * v^2
            this.F = this.F.plus(this.v.oppo().unit().multi(scalarF));
        }

        // check whether the ball collides with other balls
        for (let i = 0; i < balls.length; i++) {
            if (this !== balls[i]) {
                const that = balls[i];
                const vectorD = that.pos.minus(this.pos); // vector from this to that
                const dist = vectorD.norm();
                const unitD = vectorD.unit();
                const overlap = this.r + that.r - dist;

                // if the ball collides with another ball, see the balls as springs, and apply force by hookes law
                if (overlap > 0) {
                    const scalarF = -k * overlap; // scalar F = -k * overlap
                    this.F = this.F.plus(unitD.multi(scalarF)); // F += k * overlap * unitD

                    Ep_elastic += 1/2 * k * overlap ** 2; // E = 1/2 * k * x^2
                }

            }
        }

        Ek += 0.5 * this.m * this.v.norm() ** 2; // E = 1/2 * m * v^2

        // move the ball
        if (!frozen || tickingOnce) {
            this.a = this.F.multi(1/this.m); // a = F / m
            this.pos = this.pos.plus(this.v.multi(tickTime)).plus(this.a.multi(0.5).multi(tickTime ** 2)); // pos += v * dt + 1/2 * a * dt^2
            this.v = this.v.plus(this.a.multi(tickTime)); // v += a * dt
            tickingOnce = false;
        }

        E = Ek + Ep_gravity + Ep_elastic;

        // reset force
        this.F = new Vector(0, 0);
    }

}


function animate() {
    requestAnimationFrame(animate);
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (showInfo) {
        document.getElementById("info").innerHTML = `
            airOn: ${airOn} <br>
            gravityOn: ${gravityOn} <br>
            frozen: ${frozen} <br>
            Ek: ${Ek.toFixed(0)} <br>
            Ep_gravity: ${Ep_gravity.toFixed(0)} <br>
            Ep_elastic: ${Ep_elastic.toFixed(0)} <br>
            E: ${E.toFixed(0)} 
        `;
    } else {
        document.getElementById("info").innerHTML = "";
    }

    balls.forEach(ball => {
        ball.draw();
    });
}

function tick() {
    return setInterval(() => {
        Ek = 0;
        Ep_gravity = 0;
        Ep_elastic = 0;
        E = 0;
        balls.forEach(ball => {
            ball.move();
        });
    }, tickTime * 1000);
}

function tickOnce() {
    if (frozen) {
        tickingOnce = true;
    } else {
        console.log("Already ticking");
    }
}

function randomBall() { // generate a random ball
    const r = Math.random() * 20 + 20;
    const m = r ** 2 / 1000;
    const colour = `hsl(${Math.random() * 360}, 70%, 50%)`;
    const x = Math.random() * (canvas.width - r * 2) + r;
    const y = Math.random() * (canvas.height - r * 2) + r;
    const pos = new Vector(x, y);

    balls.push(new Ball(m, r, colour, pos));
}

function randomBallAt(pos){
    const r = Math.random() * 20 + 20;
    const m = r ** 2 / 1000;
    const colour = `hsl(${Math.random() * 360}, 70%, 50%)`;

    balls.push(new Ball(m, r, colour, pos));
}

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let showInfo = false;

let tps = 120; // ticks per second; the web calculate once every tick
let tickTime = 1 / tps; // time for each tick
let frozen = false;
let tickingOnce = false;

let balls = [];

const k = 1000; // spring constant

let Ek = 0; // kinetic energy of the system
let Ep_gravity = 0; // gravity potential energy of the system
let Ep_elastic = 0; // elastic potential energy of the system
let E = 0; // total energy of the system

let gravityOn = true;
let g = new Vector(0, 300); // acceleration of gravity

let airOn = true;
let airResistanceConstant = 0.00001; // c as in scalar F = c * d * v^2, (d is diameter of a ball)

// initialize balls
for (let i = 0; i < 5; i++) {
    randomBall();
}

window.onresize = function() {
    let canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

canvas.addEventListener("mousedown", function(event) {
    const pos = new Vector(event.clientX, event.clientY);
    randomBallAt(pos);
});

canvas.addEventListener("touchstart", function(event) {
    event.preventDefault();
    const pos = new Vector(event.touches[event.touches.length-1].clientX, event.touches[event.touches.length-1].clientY);
    randomBallAt(pos);
});

window.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "g":
            gravityOn = !gravityOn;
            break;
        case "a":
            airOn = !airOn;
            break;
        case "c":
            balls = [];
            break;
        case "f":
            frozen = !frozen;
            break;
        case "t":
            tickOnce();
            break;
        case "h":
            showInfo = !showInfo;
            break;
        default:
            break;
    }
});

tick();
animate();
