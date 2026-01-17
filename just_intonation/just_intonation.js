const canvas = document.getElementById('lissajousCanvas');
const ctx = canvas.getContext('2d');
const dimensionInput = document.getElementById('dimensionInput');
const dimensionControls = document.getElementById('dimensionControls');

let dimensions = parseInt(dimensionInput.value);
let controls = [];
let points = [];
let projectedPoints = [];

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
        label.textContent = `Dim ${i + 1}:`;
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
    for (let t = 0; t < numPoints; t++) {
        const point = [];
        for (let i = 0; i < dimensions; i++) {
            const freq = parseFloat(controls[i].freq.value);
            const phase = parseFloat(controls[i].phase.value);
            const amp = parseFloat(controls[i].amp.value);
            point.push(amp * Math.sin(freq * t * 0.1/minFreq + phase));
        }
        points.push(new Vector(...point));
    }
}

function projectPoints() {
    let vector1 = new Array(dimensions).fill(1);
    vector1 = new Vector(...vector1); // (1, 1, 1, ..., 1)
    let vector2 = new Array(dimensions).fill(1);
    vector2[0] = -1;
    vector2 = new Vector(...vector2); // (-1, 1, 1, ..., 1)
    projectedPoints = points.map(point => {
        const unit1 = vector1.unit();
        const unit2 = vector2.minus(unit1.multi(vector2.dot(unit1)));
        let projectedPoint = new Vector(point.dot(unit1), point.dot(unit2));
        return projectedPoint; // project points into plane coordinates with vector1 and
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
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const offsetX = canvas.width / 2 - ((maxX + minX) / 2) * scale;
    const offsetY = canvas.height / 2 - ((maxY + minY) / 2) * scale;

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

// Initialize
generateControls();
generatePoints();
projectPoints();
draw();
