const canvas = document.getElementById('lissajousCanvas');
const ctx = canvas.getContext('2d');
const dimensionInput = document.getElementById('dimensionInput');
const dimensionControls = document.getElementById('dimensionControls');

let dimensions = parseInt(dimensionInput.value);
let controls = [];
let points = [];
let projectedPoints = [];
let drawAxis = false;

dimensionInput.addEventListener('change', () => {
    dimensions = parseInt(dimensionInput.value);
    generateControls();
    generatePoints();
    projectPoints();
    draw();
});

function generateControls() {
    // Clear existing controls except the dimension selector
    const existingControls = dimensionControls.querySelectorAll('.control:not(:first-child)');
    existingControls.forEach(control => control.remove());

    controls = [];
    for (let i = 0; i < dimensions; i++) {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'control';

        const label = document.createElement('label');
        label.textContent = `Dim ${i}:`;
        label.style.textAlign = 'right';

        const freqInput = document.createElement('input');
        freqInput.type = 'number';
        freqInput.value = 440 * (1 + i * 0.25);
        freqInput.min = 1;
        freqInput.step = 1;
        freqInput.addEventListener('input', () => { generatePoints(); projectPoints(); draw(); });

        const phaseInput = document.createElement('input');
        phaseInput.type = 'number';
        phaseInput.value = 0;
        phaseInput.min = 0;
        phaseInput.max = 2 * Math.PI;
        phaseInput.step = 0.1;
        phaseInput.addEventListener('input', () => { generatePoints(); projectPoints(); draw(); });

        const ampInput = document.createElement('input');
        ampInput.type = 'number';
        ampInput.value = 1;
        ampInput.min = 0.1;
        ampInput.step = 0.1;
        ampInput.addEventListener('input', () => { generatePoints(); projectPoints(); draw(); });

        controlDiv.appendChild(label);
        controlDiv.appendChild(freqInput);
        controlDiv.appendChild(phaseInput);
        controlDiv.appendChild(ampInput);

        dimensionControls.appendChild(controlDiv);

        controls.push({ freq: freqInput, phase: phaseInput, amp: ampInput });
    }
}

function generatePoints() {
    points = [];
    const numPoints = 1000;
    const minFreq = Math.min(...controls.map(c => parseFloat(c.freq.value)));
    const maxFreq = Math.max(...controls.map(c => parseFloat(c.freq.value)));
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
    for (let t = 0; t < numPoints; t++) {
        const point = [];
        for (let i = 0; i < dimensions; i++) {
            const freq = parseFloat(controls[i].freq.value);
            const phase = parseFloat(controls[i].phase.value);
            const amp = parseFloat(controls[i].amp.value);
            point.push(amp * Math.sin(freq * t * 0.1/Math.max((maxFreq - minFreq), minFreq) + phase));
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
        return projectedPoint; // project points into  coordinates plane with vector1 and vector2, orthonormal
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

// Initialize
generateControls();
generatePoints();
projectPoints();
draw();
