const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let dimensions = 0;
const waves = {};
const pointsPerPeriod = 100;
const periods = 20;
let points = [];
let projectedPoints = [];
let drawAxis = false;
let lastFrameTime = performance.now();

ctx.lineJoin = 'round';

function addWave(index, amp, freq, phase0, phase=phase0) {
    waves[index] = {
        amp: amp,
        freq: freq,
        phase0: phase0,
        phase: phase,
    };
    dimensions = Object.keys(waves).length;
}

function removeWave(index) {
    delete waves[index];
    dimensions = Object.keys(waves).length;
}

function resetPhase() {
    for (let i in waves) {
        waves[i].phase = waves[i].phase0;
    }
}

function generatePoints() {
    points = [];
    const maxFreq = Math.max(...Object.values(waves).map(c => c.freq));
    const pointCount = pointsPerPeriod * periods; // set proper point count
    if (drawAxis) {
        const originPoint = new Vector(...new Array(dimensions).fill(0));
        for (let i = 0; i < dimensions; i++) {
            points.push(originPoint);
            let axis = new Array(dimensions).fill(0);
            axis[i] = 1;
            axis = new Vector(...axis);
            points.push(axis);
        }
    }
    for (let t = 0; t < pointCount; t++) {
        const point = [];
        for (let i in waves) {
            const freq = parseFloat(waves[i].freq);
            const phase = parseFloat(waves[i].phase);
            const amp = parseFloat(waves[i].amp);
            point.push(amp * Math.sin(2*Math.PI * freq * t / (maxFreq * pointsPerPeriod) + phase));
        }
        points.push(new Vector(...point));
    }
}

function projectPoints() {
    let vector1, vector2; // two vectors span the plane which is the projection plane on the screen
    if (dimensions === 2) {
        vector1 = new Vector(1, 0);
        vector2 = new Vector(0, 1);
    } else {
        vector1 = [];
        vector2 = [];
        let angle = 2*Math.PI / dimensions;
        for (let i = 0; i < dimensions; i++) {
            vector1.push(Math.cos(angle*i));
            vector2.push(Math.sin(angle*i));
            // ensure the axes are evenly distributed around a circle
            // but this works weirdly in 2D, so 2D need to be specified
        }
        vector1 = new Vector(...vector1);
        vector2 = new Vector(...vector2);
    }
    projectedPoints = points.map(point => {
        const unit1 = vector1.unit();
        const unit2 = vector2.minus(vector2.project(vector1)).unit();
        let projectedPoint = new Vector(point.dot(unit1), point.dot(unit2));
        return projectedPoint; // project points into coordinates plane with vector1 and vector2, orthonormal
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (projectedPoints.length === 0) return;

    // Scale to fit canvas
    const minX = Math.min(...projectedPoints.map(p => p.x[0]));
    const maxX = Math.max(...projectedPoints.map(p => p.x[0]));
    const minY = Math.min(...projectedPoints.map(p => p.x[1]));
    const maxY = Math.max(...projectedPoints.map(p => p.x[1]));
    let scaleX = canvas.width / (maxX - minX || 1);
    let scaleY = canvas.height / (maxY - minY || 1);
    const canvasLength = Math.min(canvas.width, canvas.height); 
    let scale = Math.min(scaleX, scaleY) * 0.8;
    if (scale > canvasLength/4) scale = canvasLength/4;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    if (drawAxis) {
        // figure
        ctx.beginPath();
        for (let i = dimensions*2; i < projectedPoints.length; i++) {
            const x = projectedPoints[i].x[0] * scale + offsetX;
            const y = projectedPoints[i].x[1] * scale + offsetY;
            if (i === dimensions*2) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        // axes
        ctx.beginPath();
        for (let i = 0; i < dimensions*2; i++) {
            const x = projectedPoints[i].x[0] * scale;
            const y = projectedPoints[i].x[1] * scale;
            if (i === 0) {
                ctx.moveTo(x + offsetX, y + offsetX);
            } else {
                ctx.lineTo(x + offsetX, y + offsetX);
            }
            if (i % 2 === 1) {
                ctx.font = '20px consolas';
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.floor(i/2)}`, x*1.15 + offsetX, y*1.15 + offsetX);
            }
        }
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // origin point
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
    } else {
        ctx.beginPath();
        for (let i = 0; i < projectedPoints.length; i++) {
            const x = projectedPoints[i].x[0] * scale + offsetX;
            const y = projectedPoints[i].x[1] * scale + offsetY;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function animate() {
    generatePoints();
    projectPoints();
    draw();
    const timeInterval = performance.now() - lastFrameTime;
    for (let i in waves) {
        waves[i].phase += 2*Math.PI * waves[i].freq * timeInterval/1000;
    }
    lastFrameTime = performance.now();
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', animate);
