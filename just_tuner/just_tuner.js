const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dimensionInput = document.getElementById('dimensionInput');
const dimensionControls = document.getElementById('dimensionControls');

// let dimensions = parseInt(dimensionInput.value);
let waves = [];
let points = [];
let projectedPoints = [];
let drawAxis = false;
let lastFrameTime = performance.now();

ctx.lineJoin = 'round';

// dimensionInput.addEventListener('change', () => {
//     dimensions = parseInt(dimensionInput.value);
//     generateControls();
//     generatePoints();
//     projectPoints();
//     draw();
// });

// function generateControls() {
//     // Clear existing controls except the dimension selector
//     const existingControls = dimensionControls.querySelectorAll('.control:not(:first-child)');
//     existingControls.forEach(control => control.remove());

//     waves = [];
//     for (let i = 0; i < dimensions; i++) {
//         const controlDiv = document.createElement('div');
//         controlDiv.className = 'control';

//         const label = document.createElement('label');
//         label.textContent = `Dim ${i}:`;
//         label.style.textAlign = 'right';

//         const freqInput = document.createElement('input');
//         freqInput.type = 'number';
//         freqInput.value = 440 * (1 + i * 0.25);
//         freqInput.min = 0.1;
//         freqInput.step = 0.1;
//         freqInput.addEventListener('input', () => {
//             const freq = Number(freqInput.value);
//             if (freq != NaN && freq != 0) {
//                 waves[i].freq = freq;
//             }
//         });

//         const phaseInput = document.createElement('input');
//         phaseInput.type = 'number';
//         phaseInput.value = 0;
//         phaseInput.step = 0.1;
//         phaseInput.addEventListener('input', () => {
//             const phase0 = Number(phaseInput.value);
//             if (phase0 != NaN) {
//                 waves[i].phase += phase0 - waves[i].phase0;
//                 waves[i].phase0 = phase0;
//             }
//         });

//         const ampInput = document.createElement('input');
//         ampInput.type = 'number';
//         ampInput.value = 1;
//         ampInput.min = 0;
//         ampInput.step = 0.1;
//         ampInput.addEventListener('input', () => { 
//             const amp = Number(ampInput.value)
//             if (amp != NaN) {
//                 waves[i].amp = amp;
//             }
//         });

//         controlDiv.appendChild(label);
//         controlDiv.appendChild(freqInput);
//         controlDiv.appendChild(phaseInput);
//         controlDiv.appendChild(ampInput);

//         dimensionControls.appendChild(controlDiv);

//         waves.push(
//             {   
//                 amp: Number(ampInput.value),
//                 freq: Number(freqInput.value), 
//                 phase0: Number(phaseInput.value), 
//                 phase: Number(phaseInput.value), 
//             }
//         );
//     }
// }

function resetPhase() {
    for (let i = 0; i < waves.length; i++) {
        waves[i].phase = waves[i].phase0;
    }
}

function generatePoints() {
    points = [];
    const numPoints = 1000;
    const minFreq = Math.min(...waves.map(c => c.freq));
    const maxFreq = Math.max(...waves.map(c => c.freq));
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
            const freq = parseFloat(waves[i].freq);
            const phase = parseFloat(waves[i].phase);
            const amp = parseFloat(waves[i].amp);
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

function animate() {
    generatePoints();
    projectPoints();
    draw();
    const timeInterval = performance.now() - lastFrameTime;
    for (let i = 0; i < waves.length; i++) {
        waves[i].phase += 2*Math.PI * waves[i].freq * timeInterval/1000;
    }
    lastFrameTime = performance.now();
    requestAnimationFrame(animate);
}

// Initialize
// generateControls();
// animate();

function octaveDecrease() {
    octave--;
    document.getElementById('octave').value = octave; 
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
}

function octaveIncrease() {
    octave++;
    document.getElementById('octave').value = octave; 
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
}

function keyDecrease() {
    if (keyInMusic == 0) {
        octave--;
        document.getElementById('octave').value = octave;
        keyInMusic = 18;
    } else {
        keyInMusic--;
    }
    document.getElementById('key').value = keyInMusic;
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
}

function keyIncrease() {
    if (keyInMusic == 18) {
        octave++;
        document.getElementById('octave').value = octave;
        keyInMusic = 0;
    } else {
        keyInMusic++;
    }
    document.getElementById('key').value = keyInMusic;
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
}


window.addEventListener('keydown', (event) => {
    if (event.target.tagName.toLowerCase() === 'input') {
        if (event.key === 'Enter') {
            event.target.blur();
            return; 
        }
    }
    
    const keyCode = event.key;
    const noteCode = keyMap[keyCode];
    const freq = frequency(noteCode);
    
    if (freq) {
        if (!activeNotes.has(noteCode)) {
            playNote(noteCode);
        }
    } else {
        switch (keyCode) {
            case 'ArrowDown': 
                octaveDecrease();
                event.preventDefault();
                break;
            case 'ArrowUp': 
                octaveIncrease();
                event.preventDefault();
                break;
            case 'ArrowLeft':
                keyDecrease();
                event.preventDefault();
                break;
            case 'ArrowRight':
                keyIncrease();
                event.preventDefault();
                break;
            case ' ':
                pressPedal();
                break;
        }
    }
});

window.addEventListener('keyup', (event) => {
    const keyCode = event.key;
    const noteCode = keyMap[keyCode];

    switch (keyCode) {
        case ' ':
            releasePedal();
            break;
    }

    stopNote(noteCode);
});

document.getElementById('volume').addEventListener('input', (event) => {
    const rawVolume = Number(event.target.value);
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        if (soundMode === 'strings') {
            gainNodes[noteCode].gain.value = volumeCurve(rawVolume); // set gain value
        }
    }
});

document.getElementById('reference').addEventListener('input', (event) => {
    reference = Number(event.target.value);
    updateActiveFrequencies();
    //updateNoteDisplay();
});

document.getElementById('octave').addEventListener('input', (event) => {
    octave = parseInt(event.target.value);
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
});

document.getElementById('key').addEventListener('input', (event) => {
    keyInMusic = parseInt(event.target.value);
    updateActiveFrequencies();
    //updateNoteDisplay();
    updateKeyNames();
});

document.getElementById('waveType').addEventListener('change', (event) => {
    waveType = event.target.value;
});   

document.getElementById('soundMode').addEventListener('change', (event) => {
    soundMode = event.target.value;
});  

window.addEventListener('blur', () => {
    stopAllSounds();
});

window.addEventListener('contextmenu', () => {
    stopAllSounds();
});

const controls = document.querySelectorAll('.control input, .control select, .control button');
document.addEventListener('mousemove', (event) => {
    controls.forEach(control => {
        const rect = control.getBoundingClientRect(); // get the bounding rect of the control
        const controlCenterX = rect.left + rect.width / 2; // x center of the control
        const controlCenterY = rect.top + rect.height / 2; // y center of the control
        const xDistanceThreshold = rect.width / 2 + 10; 
        const yDistanceThreshold = rect.height / 2 + 10;

        const xDistance = Math.abs(event.clientX - controlCenterX)
        const yDistance = Math.abs(event.clientY - controlCenterY)

        if (xDistance > xDistanceThreshold || yDistance > yDistanceThreshold) {
            control.blur(); // blur the focus if mouse cursor is too far from the control
        }
    });
});

document.getElementById('pedal').addEventListener('mousedown', () => {
    pressPedal();
});
document.getElementById('pedal').addEventListener('mouseup', () => {
    releasePedal();
});
document.getElementById('pedal').addEventListener('touchstart', (event) => {
    event.preventDefault(); // prevent the page from scrolling
    pressPedal();
});
document.getElementById('pedal').addEventListener('touchend', () => {
    releasePedal();
});
document.getElementById('pedal').addEventListener('contextmenu', (event) => {
    event.preventDefault();
});