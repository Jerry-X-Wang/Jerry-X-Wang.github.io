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
        if (this.pos.x > canvas.width - this.r) {
            if (this.v.x > g.project(new Vector(1, 0)).norm()*tickTime*2) {
                this.v.x = -this.v.x * e;
            } else if (elasticityOn) { // if the ball is out of the canvas but is not going outwards, apply a force to it
                overBound = this.pos.x - (canvas.width - this.r);
                this.F.x = this.F.x - k * overBound;
            }
        }
        if (this.pos.x < this.r) {
            if (this.v.x < -g.project(new Vector(-1, 0)).norm()*tickTime*2) {
                this.v.x = -this.v.x * e;
            } else if (elasticityOn) { // same as above
                overBound = this.pos.x - this.r;
                this.F.x = this.F.x - k * overBound;
            }
        }
        if (this.pos.y > canvas.height - this.r) {
            if (this.v.y > g.project(new Vector(0, 1)).norm()*tickTime*2) {
                this.v.y = -this.v.y * e;
            } else if (elasticityOn) { // same as above
                overBound = this.pos.y - (canvas.height - this.r);
                this.F.y = this.F.y - k * overBound;
            }
        } 
        if (this.pos.y < this.r) {
            if (this.v.y < -g.project(new Vector(0, -1)).norm()*tickTime*2) {
                this.v.y = -this.v.y * e;
            } else if (elasticityOn) { // same as above
                overBound = this.pos.y - this.r;
                this.F.y = this.F.y - k * overBound;
            }
        }
        Ep_elasticity += 0.5 * k * overBound ** 2; // E = 1/2 * k * x^2

        // apply gravity
        this.F = this.F.plus(g.multi(this.m)); // F += m * g
        Ep_gravity += this.m * g.dot(new Vector(canvas.width/2, canvas.height/2).minus(this.pos)); // E = m * g * h

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

                if (overlap > 0) {
                    const v1 = this.v;
                    const v2 = that.v;
                    // horizontal component of the velocity in the direction of unitD
                    const v1h = v1.project(unitD);
                    const v2h = v2.project(unitD);
                    if (v2h.minus(v1h).dot(unitD) < 0) {
                        // vertical component
                        const v1v = v1.minus(v1h);
                        const v2v = v2.minus(v2h);
                        
                        const m1 = this.m;
                        const m2 = that.m;

                        const v1h_final = v1h.multi(m1).plus(v2h.multi(m2)).plus(v2h.minus(v1h).multi(e*m2)).multi(1/(m1+m2));
                        const v2h_final = v1h.multi(m1).plus(v2h.multi(m2)).plus(v1h.minus(v2h).multi(e*m1)).multi(1/(m1+m2));

                        const v1_final = v1h_final.plus(v1v);
                        const v2_final = v2h_final.plus(v2v);

                        this.v = v1_final;
                        that.v = v2_final;
                    } else if (elasticityOn) { // if the ball is not moving in the direction of the other ball, see it as a spring and apply force to it
                        const scalarF = -k * overlap; // scalar F = -k * overlap
                        this.F = this.F.plus(unitD.multi(scalarF)); // F += k * overlap * unitD

                        Ep_elasticity += 1/2 * k * overlap ** 2; // E = 1/2 * k * x^2
                    }
                }
            }
        }

        Ek += 0.5 * this.m * this.v.norm() ** 2; // E = 1/2 * m * v^2

        // move the ball
        if (!frozen || tickingOnce) {
            this.a = this.F.multi(1/this.m); // a = F / m
            this.pos = this.pos.plus(this.v.multi(tickTime)).plus(this.a.multi(0.5).multi(tickTime ** 2)); // pos += v * dt + 1/2 * a * dt^2
            this.v = this.v.plus(this.a.multi(tickTime)); // v += a * dt
        }

        // reset force
        this.F = new Vector(0, 0);
    }

}


const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let infoOn = false;
let helpOn = false;

let tpsSet = 125; // ticks per second; the web calculate once every tick
let tickTime = floorToPrec(1/tpsSet, 3); // time for each tick (s); due to the limit of setInterval, the tickTime must be a integer with unit ms
tpsSet = 1 / tickTime; // due to the limit of setInterval, the tpsSet would change as well
console.log(`tpsSet actually: ${tpsSet}`)
let tps = 0; // ticks per second actually
let mspt = 0; // milliseconds per tick (ms)
let fps = 0; // frames per second actually
let frozen = false;
let tickingOnce = false;

let balls = [];
let ballCount = 0;

let e = 0.95; // restitution coefficient
let k = 1000; // spring constant
let elasticityOn = true;

let Ek = 0; // kinetic energy of the system
let Ep_gravity = 0; // gravity potential energy of the system
let Ep_elasticity = 0; // elasticity potential energy of the system
let E = 0; // total energy of the system

let gravityOn = true;
let gSet = new Vector(0, 300); // acceleration of gravity
let g = gSet;

let airOn = true;
let airResistanceConstant = 0.000001; // c as in scalar F = c * d * v^2, (d is diameter of a ball)


function showInfo() {
    document.getElementById("info").innerHTML = `
        fps: ${fps} <br>
        tps: ${tps} <br>
        mspt: ${mspt.toFixed(1)} <br>
        frozen: ${frozen} <br>
        ballCount: ${ballCount} <br>
        airOn: ${airOn} <br>
        elasticityOn: ${elasticityOn} <br>
        gravityOn: ${gravityOn} <br>
        g: ${g.toString(3)} <br>
        e: ${e.toFixed(2)} <br>
        Ek: ${Ek.toPrecision(6)} <br>
        Ep_gravity: ${Ep_gravity.toPrecision(6)} <br>
        Ep_elasticity: ${Ep_elasticity.toPrecision(6)} <br>
        E: ${E.toPrecision(6)} 
    `;
}

function animate() {
    requestAnimationFrame(animate);
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (infoOn) {
        showInfo();
    } else {
        document.getElementById("info").innerHTML = "";
    }

    balls.forEach(ball => {
        ball.draw();
    });
    countFps();
}

function countTps() {
    tps += 1;
    setTimeout(() => {
        tps -= 1;
    }, 1000);
}

function countFps() {
    fps += 1;
    setTimeout(() => {
        fps -= 1;
    }, 1000);
}

function tick() {
    return setInterval(() => {
        const startTime = performance.now();

        Ek = 0;
        Ep_gravity = 0;
        Ep_elasticity = 0;
        balls.forEach(ball => {
            ball.move();
        });
        E = Ek + Ep_gravity + Ep_elasticity;

        ballCount = balls.length;

        if (!frozen || tickingOnce) {
            countTps();
            tickingOnce = false;
        }

        const endTime = performance.now();
        mspt = endTime - startTime;
    }, tickTime * 1000);
}

function tickOnce() {
    if (frozen) {
        tickingOnce = true;
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

function toggleHelp() {
    helpOn = !helpOn;
    if (helpOn) {
        document.getElementById("help").style.display = "block";
    } else {
        document.getElementById("help").style.display = "none";
    }
}

window.onresize = function() {
    let canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

canvas.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

canvas.addEventListener("mousedown", function(event) {
    const pos = new Vector(event.clientX, event.clientY);
    if (event.button == 0 || event.button == 2) {
        if (pos.x <= 30 && pos.y <= 30) {
            infoOn = !infoOn;
        } else {
            randomBallAt(pos);
        }
    } else if (event.button == 1) {
        for (let i = balls.length - 1; i >= 0; i--) {
            if (balls[i].pos.minus(pos).norm() <= balls[i].r) {
                balls.splice(i, 1);
                break;
            }
        }
    }
});

canvas.addEventListener("touchstart", function(event) {
    event.preventDefault();
    const touchX = event.touches[event.touches.length-1].clientX;
    const touchY = event.touches[event.touches.length-1].clientY;
    const pos = new Vector(touchX, touchY);
    if (touchX <= 30 && touchY <= 30) {
        infoOn = !infoOn;
    } else {
        randomBallAt(pos);
    }
});

window.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "g":
        case "G":
            gravityOn = !gravityOn;
            if (gravityOn) {
                g = gSet;
            } else {
                g = new Vector(0, 0);
            }
            break;
        case "a":
        case "A":
            airOn = !airOn;
            break;
        case "c":
        case "C":
            balls = [];
            break;
        case "d":
        case "D":
        case "Delete":
            if (balls.length > 0) {
                balls.pop();
            }
            break;
        case "f":
        case "F":
            frozen = !frozen;
            break;
        case "t":
        case "T":
            tickOnce();
            break;
        case "i":
        case "I":
            infoOn = !infoOn;
            break;
        case "e":
        case "E":
            elasticityOn = !elasticityOn;
            break;
        case "ArrowUp":
            e += 0.05;
            if (e > 1) {
                e = 1;
            }
            break;
        case "ArrowDown":
            e -= 0.05;
            if (e < 0) {
                e = 0;
            }
            break;
        case "h":
        case "H":
            toggleHelp();
            break;
        default:
            break;
    }
});


// initialize balls
for (let i = 0; i < 5; i++) {
    randomBall();
}

tick();
animate();
