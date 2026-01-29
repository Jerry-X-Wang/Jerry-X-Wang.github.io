let temperament = document.getElementById('temperament').value; // autoJust, or 12tet
let tuningBase = document.getElementById('tuningBase').value; // Base of tuning, only for (auto) just tuning
const rawVolume = 0.7; // raw volume, a preset constant
let masterVolume = Number(document.getElementById('volume').value); // master volume controlled by slider
let baseFreq = Number(document.getElementById('baseFreq').value); // Base frequency
let octave = Number(document.getElementById('octave').value); // Octave number
let keyOffset = 0; // Key offset
let waveType = document.getElementById('waveType').value; // Wave type: sine, square, sawtooth, or triangle
let soundMode = document.getElementById('soundMode').value; // Sound mode: piano, strings, or bells
let phaseDiff = document.getElementById('phaseDiff').checked; // Whether to consider phase difference

let pedal = false; // Whether the pedal is pressed or not

const piano = document.getElementById('piano');

const notes = ['C', 'C♯(D♭)', 'D', 'D♯(E♭)', 'E', 'F', 'F♯(G♭)', 'G', 'G♯(A♭)', 'A', 'A♯(B♭)', 'B']
const justRatio = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8] // frequency ratio of just intonation

// use midi note number: 60 -> C4
const startNote = 21; // A0
const endNote = 108; // C8
let whiteKeyWidth = 60; // pixel width of a white key
let borderWidth = 2; // pixel width of key border
const offset = -Math.floor((startNote * (7/12)*whiteKeyWidth) / whiteKeyWidth) * whiteKeyWidth; // offset of the keyboard from the left edge of the piano (Math.floor is to round down to the nearest multiple of whiteKeyWidth)
// in the following arrays, 0 -> C
const whiteKeyNumbers = [0, 2, 4, 5, 7, 9, 11];
const blackKeyNumbers = [1, 3, 6, 8, 10];
let keys;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const masterGainNode = audioContext.createGain();
masterGainNode.connect(audioContext.destination);
masterGainNode.gain.value = masterVolume;
const oscillators = {};
const gainNodes = {};
const pressedNotes = new Set();
const timeoutStopSound = {};

let midiAccess;

const keyMap = {
    'z': 48, // C3
    's': 49,
    'x': 50,
    'd': 51,
    'c': 52,

    'v': 53,
    'g': 54,
    'b': 55,
    'h': 56,
    'n': 57,
    'j': 58,
    'm': 59,

    ',': 60, // C4
    'l': 61,
    '.': 62,
    ';': 63,
    '/': 64,

    'q': 65,
    '2': 66,
    'w': 67,
    '3': 68,
    'e': 69,
    '4': 70,
    'r': 71,

    't': 72, // C5
    '6': 73,
    'y': 74,
    '7': 75,
    'u': 76,

    'i': 77,
    '9': 78,
    'o': 79,
    '0': 80,
    'p': 81,
    '-': 82,
    '[': 83,

    ']': 84, // C6
    'Backspace': 85,
    '\\': 86,

    '`': 88,
}

function keyPosition(noteNumber) {
    noteNumber = Number(noteNumber);
    let position;
    switch (mod(noteNumber, 12)) {
        case 0:
            position = 0;
            break;
        case 1:
            position = 3/5 * whiteKeyWidth;
            break;
        case 2:
            position = whiteKeyWidth;
            break;
        case 3:
            position = 3 * 3/5 * whiteKeyWidth;
            break;
        case 4:
            position = 2 * whiteKeyWidth;
            break;
        case 5: 
            position = 3 * whiteKeyWidth;
            break;
        case 6:
            position = (3 + 4/7) * whiteKeyWidth;
            break;
        case 7:
            position = 4 * whiteKeyWidth;
            break;
        case 8:
            position = (3 + 3 * 4/7) * whiteKeyWidth;
            break;
        case 9:
            position = 5 * whiteKeyWidth;
            break;
        case 10:
            position = (3 + 5 * 4/7) * whiteKeyWidth;
            break;
        case 11:
            position = 6 * whiteKeyWidth;
            break;
        default:
            console.error('Invalid noteNumber');
            break;
    }
    position += whiteKeyWidth * (7*Math.floor(noteNumber/12)) + offset;
    return position;
}

function removeAllActiveKeys() {
    keys.forEach(key => {
        if (key.classList.contains('active')) {
            key.classList.remove('active');
        }
    });
}

function updateKeyNames() {
    keys.forEach(key => {
        key.querySelector('span').innerText = keyName(key.noteNumber);
    });
}

function noteName(noteNumber) {
    noteNumber = Number(noteNumber);
    return notes[mod(noteNumber + keyOffset, 12)] + (Math.floor((noteNumber + keyOffset) / 12) + octave - 5);
    //     note name                                octave
}

function keyName(noteNumber) {
    noteNumber = Number(noteNumber);
    let keyName = noteName(noteNumber);
    if (keyName.includes('(')) { // change name like C♯(D♭)4 into C♯4 \n D♭4
        const octave = keyName.slice(-1);
        keyName = keyName.slice(0, keyName.indexOf('(')) + octave + '\n' +
            keyName.slice(keyName.indexOf('(') + 1, keyName.indexOf(')')) + octave;
    }
    return keyName;
}

function frequency(noteNumber) {
    noteNumber = Number(noteNumber);
    switch (temperament) {
        case 'autoJust':
        case '12tetPlusJust': {
            const tuningBaseFreq = baseFreq * 2**((tuningBase - 9) / 12 + octave - 4);
            const ratioInOctave = justRatio[mod(noteNumber + keyOffset - tuningBase, 12)];
            const ratioOctave = 2 ** Math.floor((noteNumber + keyOffset - tuningBase - 60) / 12);
            return tuningBaseFreq * ratioInOctave * ratioOctave;
        }
        case 'just': {
            const tuningBaseRatio = 1 / justRatio[mod(9 - tuningBase, 12)];
            let tuningBaseFreq = baseFreq * tuningBaseRatio;
            if (tuningBase > 9) { // lower by a octave if the tuning base is lower than A
                tuningBaseFreq *= 2;
            }
            const ratioInOctave = justRatio[mod(noteNumber + keyOffset - tuningBase, 12)];
            const ratioOctave = 2 ** Math.floor((noteNumber + keyOffset - tuningBase - 60) / 12);
            return tuningBaseFreq * ratioInOctave * ratioOctave;
        }
        case '12tet': {
            return baseFreq * 2**((noteNumber + keyOffset - 69) / 12 + octave - 4);
        }
        default: {
            console.error(`Invalid temperament: ${temperament}`);
            break;
        }
    }
}

function volumeCurve(rawVolume, freq) {
    let volume = (rawVolume / 2) ** 2;
        switch (waveType) { // set gain value in different cases
        case 'sine':
            volume *= (440/freq)**0.5;
            break;
        case 'square':
        case 'sawtooth':
            break;
        case 'triangle':
            volume *= 1.5 * (440/freq)**0.3;
            break;
        default:
            break;
    } 
    if (soundMode == 'strings') {
        volume *= 0.7;
    }
    return volume;
}

function dissonance(...simplfiedFreqs) { // uses Euler's formula to calculate dissonance
    const freqLcm = lcm(...simplfiedFreqs);
    const factors = primeFactors(freqLcm);
    let sum = 1; 
    
    for (const [prime, exponent] of Object.entries(factors)) {
        const p = parseInt(prime); 
        const a = exponent;
        sum += a * (p - 1);
    }
    
    return sum;
}

function transposeTuningBase(newNote=null) {
    newNote = Number(newNote);
    if (temperament != 'autoJust') {
        console.warn('transposeTuningBase can only work in auto just intonation')
        return;
    }

    let playingNoteCount = Object.keys(oscillators).length;
    if (newNote) { // when note plays sound
        playingNoteCount++
    }

    if (playingNoteCount == 0) {
        return; // do nothing
    } else if (playingNoteCount == 1) {
        if (newNote) {
            tuningBase = mod(newNote, 12);
        } else {
            tuningBase = mod(Number(Object.keys(oscillators)[0]), 12);
        }
    } else { // find the purest tuning base
        const dissonances = [];
        const lastTuningBase = tuningBase;
        for (let i = 0; i < 12; i++) { // try all tuning bases and calculate their dissonance
            tuningBase = i;
            const freqs = [];
            if (newNote) {
                freqs.push(frequency(newNote));
            } 
            for (let i in oscillators) {
                freqs.push(frequency(Number(i)));
            }
            const freqGcd = gcd(...freqs);
            const simplfiedFreqs = freqs.map(freq => Math.round(freq / freqGcd));
            dissonances.push(dissonance(...simplfiedFreqs));
        }
        const harmonyTuningBases = findAllIndexesOfMin(dissonances);
        if (harmonyTuningBases.includes(lastTuningBase)) {
            tuningBase = lastTuningBase; // if last tuning base is great, continue applying it
        } else {
            const lastNotes = Object.keys(oscillators).sort();
            tuningBase = lastTuningBase;
            const lastFreqs = lastNotes.map(noteNumber => frequency(Number(noteNumber)))
            const rmses = [];
            const meanErrors = [];
            for (let base of harmonyTuningBases) { // try all harmony tuning bases and find the one with the least frequency variation 
                tuningBase = base; 
                const currentfreqs = [];
                for (let noteNumber of lastNotes) {
                    noteNumber = Number(noteNumber);
                    currentfreqs.push(frequency(noteNumber))
                }
                rmses.push(rmse(lastFreqs, currentfreqs));
                meanErrors.push(meanError(lastFreqs, currentfreqs));
            }
            const indexesOfLeastRmse = findAllIndexesOfMin(rmses);
            if (indexesOfLeastRmse.length == 1) {
                tuningBase = harmonyTuningBases[indexesOfLeastRmse[0]]; // if there is only one with the least RMSE, choose it
            } else {
                const indexesOfLeastMeanError = findAllIndexesOfMin(meanErrors).filter(index => indexesOfLeastRmse.includes(index));
                tuningBase = harmonyTuningBases[indexesOfLeastMeanError[0]]; // choose the first of the ones with least mean error
            }
        }
    }

    document.getElementById('tuningBase').value = tuningBase;
    updateActiveFrequencies();
}

function playSound(noteNumber, velocity=95) {
    noteNumber = Number(noteNumber);
    const freq = frequency(noteNumber);
    console.log(`Playing sound: ${freq.toFixed(3)} Hz` )

    const gainNode = audioContext.createGain();
    gainNode.connect(masterGainNode);
    gainNodes[noteNumber] = gainNode;
    gainNode.gain.value = volumeCurve(rawVolume, freq) * (velocity/127)**2

    const oscillator = audioContext.createOscillator();
    oscillator.type = waveType; // wave type
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.connect(gainNode); // connect oscillator to gain node
    oscillator.start();
    oscillators[noteNumber] = oscillator;

    addWave(noteNumber, 0, freq, 0); // amp will be updated in updateWaves()
    if (!phaseDiff) {
        resetPhase();
    }

    const currentGain = gainNodes[noteNumber].gain.value;
    const currentTime = audioContext.currentTime;

    let halfLife; // unit: second
    let gain = currentGain;
    let time = 0;
    // gainCurve = t => currentGain * (0.5 ** (1 / halfLife)) ** t; // exponential function with given halfLife
    // here we use timeCurve instead of gainCurve in order to improve performance
    const timeCurve = gain => (halfLife * Math.log2(currentGain / gain)); // inverse function of gainCurve

    switch (soundMode) {
        case 'piano':
            halfLife = 0.8 * (440/freq)**0.5;

            for (; gain > 0.0001; gain -= 0.0001) { // set the gains from now on, until it's too quiet
                time = timeCurve(gain);
                gainNodes[noteNumber].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteNumber] = setTimeout(() => {
                if (oscillators[noteNumber]) {
                    stopSound(noteNumber);
                }
            }, time * 1000);
            break;
        case 'bells':
            halfLife = 1.2 * (440/freq)**0.5;

            for (; gain > 0.0001; gain -= 0.0001) { // set the gains from now on, until it's too quiet
                time = timeCurve(gain);
                gainNodes[noteNumber].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteNumber] = setTimeout(() => {
                if (oscillators[noteNumber]) {
                    stopSound(noteNumber);
                }
            }, time * 1000);

            if (pedal) {
                clearTimeout(timeoutStopSound[noteNumber]);
                timeoutStopSound[noteNumber] = setTimeout(() => {
                    if (oscillators[noteNumber]) {
                        stopSound(noteNumber);
                    }
                }, 100); // if pedal is pressed, stop the sound after 100ms, just like you are holding a bell
            }
            break;
        case 'strings':
            break;
        default:
            oscillators[noteNumber].stop(currentTime);
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    } 
}

function stopSound(noteNumber) {
    noteNumber = Number(noteNumber);
    clearTimeout(timeoutStopSound[noteNumber]);
    gainNodes[noteNumber].gain.cancelScheduledValues(audioContext.currentTime); // cancel the schedule before

    const currentGain = gainNodes[noteNumber].gain.value;
    const halfLife = 0.05; // unit: second
    const currentTime = audioContext.currentTime;
    let gain = currentGain;

    const gainCurve = t => currentGain * (0.5 ** (1 / halfLife)) ** t; // exponential function with given halfLife
    let time = 0;
    for (; gain >= 0.001; time += 0.001) { // set the gainNodes from now on, until it's too quiet
        gain = gainCurve(time);
        gainNodes[noteNumber].gain.setValueAtTime(gain, currentTime + time);
    }

    oscillators[noteNumber].stop(currentTime + time);
    delete oscillators[noteNumber];
    delete gainNodes[noteNumber];
    removeWave(noteNumber);
}

function stopAllSounds() {
    for (let noteNumber in oscillators) {
        noteNumber = Number(noteNumber);
        stopSound(noteNumber);
    }
}

function playNote(noteNumber, velocity=95) {
    noteNumber = Number(noteNumber);
    keys.forEach(key => {
        if (key.noteNumber == noteNumber && !key.classList.contains('active')) {
            key.classList.add('active');
        }
    });
    if (oscillators[noteNumber]) {
        stopSound(noteNumber); // if the note is already playing, stop the sound first, then we can start the new sound
    }

    if (temperament == 'autoJust') {
        transposeTuningBase(noteNumber);
    }

    pressedNotes.add(noteNumber);
    playSound(noteNumber, velocity);
}

function stopNote(noteNumber) {
    noteNumber = Number(noteNumber);
    keys.forEach(key => {
        if (key.noteNumber == noteNumber && key.classList.contains('active')) {
            key.classList.remove('active');
        }
    });
    switch (soundMode) {
        case 'piano':
        case 'strings':
            if (!pedal) {
                if (oscillators[noteNumber]) {
                    stopSound(noteNumber);
                }
            }
            break;
        case 'bells':
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
    
    if (pressedNotes.has(noteNumber)) {
        pressedNotes.delete(noteNumber);
    }

    if (temperament == 'autoJust') {
        transposeTuningBase();
    }
}

function pressPedal() {
    pedal = true;
    document.getElementById('pedal').style.backgroundColor = '#bbb';
    switch (soundMode) {
        case 'piano':
        case 'strings':
            break;
        case 'bells':
            stopAllSounds();
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
}

function releasePedal() {
    pedal = false;
    document.getElementById('pedal').style.backgroundColor = '#eee';
    switch (soundMode) {
        case 'piano':
        case 'strings':
            for (let noteNumber in oscillators) {
                noteNumber = Number(noteNumber);
                if (!pressedNotes.has(noteNumber)) {
                    stopSound(noteNumber);
                    if (temperament == 'autoJust') {
                        transposeTuningBase();
                    }
                }
            }
            break;
        case 'bells':
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
}

function updateActiveFrequencies() {
    for (let noteNumber in oscillators) {
        const activeFrequency = frequency(Number(noteNumber));
        if (oscillators[noteNumber]) {
            oscillators[noteNumber].frequency.setValueAtTime(activeFrequency, audioContext.currentTime);
        }
    }
}

function tuningBaseDecrease() {
    tuningBase--;
    tuningBase = mod(tuningBase, 12);
    document.getElementById('tuningBase').value = tuningBase;
    updateActiveFrequencies();
}

function tuningBaseIncrease() {
    tuningBase++;
    tuningBase = mod(tuningBase, 12);
    document.getElementById('tuningBase').value = tuningBase;
    updateActiveFrequencies();
}

function updateWaves() {
    for (let noteNumber in waves) {
        waves[noteNumber].amp = gainNodes[noteNumber].gain.value * 16 / rawVolume ** 2;
        waves[noteNumber].freq = frequency(Number(noteNumber));
    }
    requestAnimationFrame(updateWaves);
}

function octaveDecrease() {
    octave--;
    document.getElementById('octave').value = octave; 
    updateActiveFrequencies();
    updateKeyNames();
}

function octaveIncrease() {
    octave++;
    document.getElementById('octave').value = octave; 
    updateActiveFrequencies();
    updateKeyNames();
}

function keyDecrease() {
    if (keyOffset == 0) {
        octave--;
        document.getElementById('octave').value = octave;
        keyOffset = 11;
    } else {
        keyOffset--;
    }
    document.getElementById('keyOffset').value = keyOffset;
    updateActiveFrequencies();
    updateKeyNames();
}

function keyIncrease() {
    if (keyOffset == 11) {
        octave++;
        document.getElementById('octave').value = octave;
        keyOffset = 0;
    } else {
        keyOffset++;
    }
    document.getElementById('keyOffset').value = keyOffset;
    updateActiveFrequencies();
    updateKeyNames();
}

function changeTuningBaseDisplay() {
    switch (temperament) {
        case 'autoJust':
        case 'just':
        case '12tetPlusJust':
            document.getElementById('tuningBase').parentNode.style.display = 'flex';
            break;
        case '12tet':
            document.getElementById('tuningBase').parentNode.style.display = 'none';
            break;
        default:
            console.error(`Invalid temperament ${temperament}`)
            break;
    }
}

function handleMIDIMessage(message) {
    const [status, noteNumber, velocity] = message.data;
    if (status >= 144 && status <= 159 && velocity > 0) { // Note on
        playNote(noteNumber, velocity);
    } else if ((status >= 128 && status <= 143) || (status >= 144 && status <= 159 && velocity === 0)) { // Note off
        stopNote(noteNumber);
    } else if (status >= 176 && status <= 191 && noteNumber === 64) { // Control Change: Sustain pedal (CC 64)
        if (velocity >= 64) { // Pedal pressed (values 64-127)
            pressPedal();
        } else { // Pedal released (values 0-63)
            releasePedal();
        }
    }
}


window.addEventListener('keydown', (event) => {
    if (event.target.tagName.toLowerCase() === 'input') {
        if (event.key === 'Enter') {
            event.target.blur();
            return; 
        }
    }
    
    const keyCode = event.key;
    const noteNumber = Number(keyMap[keyCode]);
    const freq = frequency(noteNumber);
    
    if (freq) {
        if (!pressedNotes.has(noteNumber)) {
            playNote(noteNumber);
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
                tuningBaseDecrease();
                event.preventDefault();
                break;
            case 'ArrowRight':
                tuningBaseIncrease();
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
    const noteNumber = Number(keyMap[keyCode]);

    switch (keyCode) {
        case ' ':
            releasePedal();
            break;
    }

    stopNote(noteNumber);
});

document.getElementById('keyOffset').addEventListener('input', function() {
    updateKeyNames();
});

window.addEventListener('blur', () => {
    stopAllSounds();
    removeAllActiveKeys();
});

window.addEventListener('contextmenu', () => {
    removeAllActiveKeys();
    stopAllSounds();
});

document.getElementById('temperament').addEventListener('change', (event) => {
    temperament = event.target.value;
    updateActiveFrequencies();
    changeTuningBaseDisplay();
});

document.getElementById('tuningBase').addEventListener('change', (event) => {
    tuningBase = Number(event.target.value);
});

document.getElementById('volume').addEventListener('input', (event) => {
    masterVolume = Number(event.target.value);
    masterGainNode.gain.value = masterVolume;
});

document.getElementById('baseFreq').addEventListener('input', (event) => {
    baseFreq = Number(event.target.value);
    updateActiveFrequencies();
});

document.getElementById('octave').addEventListener('input', (event) => {
    octave = parseInt(event.target.value);
    updateActiveFrequencies();
    updateKeyNames();
});

document.getElementById('keyOffset').addEventListener('input', (event) => {
    keyOffset = parseInt(event.target.value);
    updateActiveFrequencies();
    updateKeyNames();
});

document.getElementById('waveType').addEventListener('change', (event) => {
    waveType = event.target.value;
});   

document.getElementById('soundMode').addEventListener('change', (event) => {
    soundMode = event.target.value;
});  

document.getElementById('phaseDiff').addEventListener('change', (event) => {
    phaseDiff = event.target.checked;
    if (!phaseDiff) {
        resetPhase();
    }
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

function init() {
    // create keys
    for (let noteNumber = startNote; noteNumber <= endNote; noteNumber++) {
        // noteNumber, 60 -> C4
        const key = document.createElement('div');
        piano.appendChild(key);
        key.noteNumber = noteNumber;

        const span = document.createElement('span');
        span.innerText = keyName(noteNumber);
        key.appendChild(span);

        if (whiteKeyNumbers.includes(mod(noteNumber, 12))) { // white keys
            key.style.left = `${keyPosition(noteNumber)}px`;
            key.style.border = `${borderWidth}px solid #bbb`;
            key.classList.add('white-key');
            const keyWidth = whiteKeyWidth - 2*borderWidth;
            key.style.width = `${keyWidth}px`;

            span.style.position = 'absolute';
            span.style.width = `${keyWidth}px`;
            switch (mod(noteNumber, 12)) { // adjust text position
                case 0:
                case 5:
                    span.style.left = '-20%';
                    break;
                case 4:
                case 11:
                    span.style.left = '20%';
                    break;
                case 7:
                    span.style.left = '-7%';
                    break;
                case 9:
                    span.style.left = '7%';
                    break
                default:
                    span.style.left = '0';
                    break;
            }

        } else if (blackKeyNumbers.includes(mod(noteNumber, 12))) { // black keys
            key.style.left = `${keyPosition(noteNumber) - borderWidth}px`;
            key.style.border = `${borderWidth}px solid #bbb`;
            key.classList.add('black-key');
            const keyWidth = whiteKeyWidth*7/12;
            key.style.width = `${keyWidth}px`;

        } else {
            console.error(`Invalid key index: ${noteNumber}`);
        }
    }

    let windowHeight = window.innerHeight;
    const margin = 50;
    const pianoHeight = document.getElementsByClassName('piano-container')[0].clientHeight;
    const pedalHeight = document.getElementById('pedal').clientHeight;
    const titleHeight = document.getElementsByClassName('title')[0].clientHeight;
    let restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
    document.getElementById('panel').style.height = `${restHeight}px`;
    document.getElementById('canvas').style.height = `${restHeight}px`;

    window.addEventListener('resize', function() {
        windowHeight = window.innerHeight;
        restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
        document.getElementById('panel').style.height = `${restHeight}px`;
        document.getElementById('canvas').style.height = `${restHeight}px`;
    });

    // set the scroll bar to the center
    const pianoContainer = document.getElementsByClassName('piano-container')[0];
    const keysWidth = piano.scrollWidth; 
    const containerWidth = pianoContainer.clientWidth; 
    const scrollPosition = (keysWidth - containerWidth) / 2; 
    pianoContainer.scrollLeft = scrollPosition; 

    keys = document.querySelectorAll('.white-key, .black-key');

    pianoContainer.addEventListener('wheel', function(event) {
        pianoContainer.scrollBy({
            left: event.deltaY,
        });
    });

    keys.forEach(key => {
        key.addEventListener('touchstart', function(event) {
            event.preventDefault(); // prevent the page from scrolling
            const noteNumber = Number(key.noteNumber);
            playNote(noteNumber);
        });

        key.addEventListener('touchend', function() {
            const noteNumber = Number(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener('touchleave', function() {
            const noteNumber = Number(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener('mousedown', function() {
            const noteNumber = Number(key.noteNumber);
            playNote(noteNumber);
        });

        key.addEventListener('mouseup', function() {
            const noteNumber = Number(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener('mouseleave', function() {
            const noteNumber = Number(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener('mousemove', function(event) {
            if (event.buttons == 1 && !key.classList.contains('active')) { // left mouse button is down
                const noteNumber = Number(key.noteNumber);
                playNote(noteNumber);
            }
        });

        key.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // prevent the default context menu from appearing
        });
    });

    // Request MIDI access
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(function(access) {
            midiAccess = access;
            const inputs = midiAccess.inputs.values();
            for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                input.value.onmidimessage = handleMIDIMessage;
            }
        }).catch(function(error) {
            console.error('MIDI access denied or not available:', error);
        });
    } else {
        console.warn('Web MIDI API not supported in this browser.');
    }

    changeTuningBaseDisplay();
    updateWaves();
}

document.addEventListener('DOMContentLoaded', init);