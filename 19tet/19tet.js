// 19-Tone equal temperament

let reference = 440; // Reference frequency
document.getElementById("reference").value = reference;

let octave = 4; // Octave number
document.getElementById("octave").value = octave;

let key = 0; // key in music

let waveType = "triangle"; // Wave type: sine, square, sawtooth, or triangle
document.getElementById("waveType").value = waveType;

let soundMode = "piano"; // Sound mode: piano, strings, or bells
document.getElementById("soundMode").value = soundMode;

let pedal = false; // Whether the pedal is pressed or not

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillators = {};
const gainNodes = {}; 
const activeNotes = new Set();
const timeoutStopSound = {};

const noteCodes = { // 0 -> A4
    "q": -14,
    "a": -13,
    "z": -12,

    "w": -11,
    "s": -10,
    "x": -9,

    "e": -8,
    "d": -7,

    "r": -6,
    "f": -5,
    "v": -4,

    "t": -3,
    "g": -2,
    "b": -1,

    "y": 0,
    "h": 1,
    "n": 2,

    "u": 3,
    "j": 4,
    
    "i": 5,
    "k": 6,
    ",": 7,

    "o": 8,
    "l": 9,
    ".": 10,

    "p": 11,
    ";": 12,

    "[": 13,
    "'": 14,
    "/": 15,

    "]": 16,
    "\\": 19,
    "`": 22,
    "1": 24,
    "2": 27,
    "3": 30,
    "4": 32,
    "5": 35,
    "6": 38,
    "7": 41,
    "8": 43,
    "9": 46,
    "0": 49,
    "-": 51,
    "=": 54,
};

const notes = ["A", "A♯", "B♭", "B", "B♯(C♭)", "C", "C♯", "D♭", "D", "D♯", "E♭", "E", "E♯(F♭)", "F", "F♯", "G♭", "G", "G♯", "A♭"]

function frequency(noteCode) {
    return reference * 2**((noteCode + key)/19 + octave - 4);
}

function volumeCurve(rawVolume) {
    return (rawVolume / 2) ** 2;
}

function updateNoteDisplay() {
    let noteNumbers = [];
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        noteNumbers.push(noteCode + key);
    }
    noteNumbers.sort((a, b) => a - b);
    let display = "";
    for (let i in noteNumbers) {
        let freq = frequency(noteNumbers[i]);
        if (freq < 100) {
            freq = freq.toPrecision(3);
        } else {
            freq = freq.toFixed();
        }
        display += notes[mod(noteNumbers[i], 19)] + (Math.floor((noteNumbers[i] + 14) / 19) + octave) + " " + freq + "\u2006Hz" + "\n";
        //         note name                        octave                        ↓                           frequency
        //                                                                        14 is because there is 14 semitones between C and A in 19-TET
    }
    document.getElementById("noteDisplay").textContent = display;
}

function updateActiveFrequencies() {
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        const activeFrequency = frequency(noteCode);
        if (oscillators[noteCode]) {
            oscillators[noteCode].frequency.setValueAtTime(activeFrequency, audioContext.currentTime);
        }
    }
}

function playSound(noteCode) {
    const freq = frequency(noteCode);
    
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodes[noteCode] = gainNode;
    const volume = volumeCurve(parseFloat(document.getElementById("volume").value))
    switch (waveType) { // set gain value in different cases
        case "sine":
            if (freq >= 440) {
                gainNode.gain.value = volume
            } else {
                gainNode.gain.value = volume * 440/freq;
            }
            break;
        case "square":
            gainNode.gain.value = volume;
            break;
        case "sawtooth":
            gainNode.gain.value = volume;
            break;
        case "triangle":
            if (freq >= 440) {
                gainNode.gain.value = volume
            } else {
                gainNode.gain.value = volume * 440/freq;
            }
            break;
        default:
            gainNode.gain.value = volume; 
            break;
    } 

    const oscillator = audioContext.createOscillator();
    oscillator.type = waveType; // wave type
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.connect(gainNode); // connect oscillator to gain node
    oscillator.start();
    oscillators[noteCode] = oscillator;

    updateNoteDisplay();

    const currentGain = gainNodes[noteCode].gain.value;
    const currentTime = audioContext.currentTime;

    let halfLife; // unit: second
    let gain = currentGain;
    let time = 0;
    const gainCurve = t => currentGain * (0.5 ** (1 / halfLife)) ** (t**0.5); // similiar to a exponential function with given halfLife

    switch (soundMode) {
        case "piano":
            halfLife = 0.5 * (440/freq)**0.3;

            for (; gain >= 0.0001; time += 0.01) { // set the gains from now on, until it's too quiet
                gain = gainCurve(time);
                gainNodes[noteCode].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteCode] = setTimeout(() => {
                if (oscillators[noteCode]) {
                    stopSound(noteCode);
                }
            }, time * 1000);
            break;
        case "bells":
            halfLife = 0.5 * (440/freq)**0.3;

            for (; gain >= 0.0001; time += 0.01) { // set the gains from now on, until it's too quiet
                gain = gainCurve(time);
                gainNodes[noteCode].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteCode] = setTimeout(() => {
                if (oscillators[noteCode]) {
                    stopSound(noteCode);
                }
            }, time * 1000);

            if (pedal) {
                clearTimeout(timeoutStopSound[noteCode]);
                timeoutStopSound[noteCode] = setTimeout(() => {
                    if (oscillators[noteCode]) {
                        stopSound(noteCode);
                    }
                }, 100); // if pedal is pressed, stop the sound after 100ms, just like you are holding a bell
            }
            break;
        case "strings":
            gainNodes[noteCode].gain.setValueAtTime(0.7 * currentGain, currentTime);
            break;
        default:
            oscillators[noteCode].stop(currentTime);
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    } 
}

function stopSound(noteCode) {
    clearTimeout(timeoutStopSound[noteCode]);
    gainNodes[noteCode].gain.cancelScheduledValues(audioContext.currentTime); // cancel the schedule before

    const currentGain = gainNodes[noteCode].gain.value;
    const halfLife = 0.05; // unit: second
    const currentTime = audioContext.currentTime;
    let gain = currentGain;

    const gainCurve = t => currentGain * (0.5 ** (1 / halfLife)) ** t; // exponential function with given halfLife
    let time = 0;
    for (; gain >= 0.001; time += 0.001) { // set the gainNodes from now on, until it's too quiet
        gain = gainCurve(time);
        gainNodes[noteCode].gain.setValueAtTime(gain, currentTime + time);
    }

    oscillators[noteCode].stop(currentTime + time);
    delete oscillators[noteCode];
    delete gainNodes[noteCode];
    updateNoteDisplay();
}

function stopAllSounds() {
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        stopSound(noteCode);
    }
}

function playNote(noteCode) {
    if (oscillators[noteCode]) {
        stopSound(noteCode); // if the note is already playing, stop the sound first, then we can start the new sound
    }
    activeNotes.add(noteCode);
    playSound(noteCode);
}

function stopNote(noteCode) {
    switch (soundMode) {
        case "piano":
        case "strings":
            if (!pedal) {
                if (oscillators[noteCode]) {
                    stopSound(noteCode);
                }
            }
            break;
        case "bells":
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
    
    if (activeNotes.has(noteCode)) {
        activeNotes.delete(noteCode);
        updateNoteDisplay();
    }
}

function pressPedal() {
    pedal = true;
    document.getElementById("pedal").style.backgroundColor = "#bbb";
    switch (soundMode) {
        case "piano":
        case "strings":
            break;
        case "bells":
            stopAllSounds();
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
}

function releasePedal() {
    pedal = false;
    document.getElementById("pedal").style.backgroundColor = "#eee";
    switch (soundMode) {
        case "piano":
        case "strings":
            for (let noteCode in oscillators) {
                noteCode = parseInt(noteCode);
                if (!activeNotes.has(noteCode)) { // here needs to be fixed
                    stopSound(noteCode);
                }
            }
            break;
        case "bells":
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
}

function octaveDecrease() {
    octave--;
    document.getElementById("octave").value = octave; 
    updateActiveFrequencies(); 
    updateNoteDisplay();
}

function octaveIncrease() {
    octave++;
    document.getElementById("octave").value = octave; 
    updateActiveFrequencies(); 
    updateNoteDisplay();
}

function keyDecrease() {
    if (key == 0) {
        octave--;
        document.getElementById("octave").value = octave;
        key = 18;
    } else {
        key--;
    }
    document.getElementById("key").value = key;
    updateActiveFrequencies(); 
    updateNoteDisplay();
}

function keyIncrease() {
    if (key == 18) {
        octave++;
        document.getElementById("octave").value = octave;
        key = 0;
    } else {
        key++;
    }
    document.getElementById("key").value = key;
    updateActiveFrequencies(); 
    updateNoteDisplay();
}


window.addEventListener("keydown", (event) => {
    if (event.target.tagName.toLowerCase() === "input") {
        if (event.key === "Enter") {
            event.target.blur();
            return; 
        }
    }
    
    const keyCode = event.key;
    const noteCode = noteCodes[keyCode]
    const freq = frequency(noteCode);
    
    if (freq) {
        if (!activeNotes.has(noteCode)) {
            playNote(noteCode);
        }
    } else {
        switch (keyCode) {
            case "ArrowDown": 
                octaveDecrease();
                break;
            case "ArrowUp": 
                octaveIncrease();
                break;
            case "ArrowLeft":
                keyDecrease();
                break;
            case "ArrowRight":
                keyIncrease();
                break;
            case " ":
                pressPedal();
                break;
        }
    }
});

window.addEventListener("keyup", (event) => {
    const keyCode = event.key;
    const noteCode = noteCodes[keyCode];

    switch (keyCode) {
        case " ":
            releasePedal();
            break;
    }

    stopNote(noteCode);
});

document.getElementById("volume").addEventListener("input", (event) => {
    const rawVolume = parseFloat(event.target.value);
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        if (soundMode === "strings") {
            gainNodes[noteCode].gain.value = volumeCurve(rawVolume); // set gain value
        }
    }
});

document.getElementById("reference").addEventListener("input", (event) => {
    reference = parseFloat(event.target.value);
    updateActiveFrequencies(); 
    updateNoteDisplay();
});
document.getElementById("refIncrease").addEventListener("click", () => {
    reference++;
    document.getElementById("reference").value = reference;
    updateActiveFrequencies();
    updateNoteDisplay();
    document.activeElement.blur();
});
document.getElementById("refDecrease").addEventListener("click", () => {
    if (reference > 1) reference--;
    document.getElementById("reference").value = reference;
    updateActiveFrequencies();
    updateNoteDisplay();
    document.activeElement.blur();
});

document.getElementById("octave").addEventListener("input", (event) => {
    octave = parseInt(event.target.value);
    updateActiveFrequencies(); 
    updateNoteDisplay();
});
document.getElementById("octaveDecrease").addEventListener("click", () => {
    octaveDecrease();
    document.activeElement.blur();
});
document.getElementById("octaveIncrease").addEventListener("click", () => {
    octaveIncrease();
    document.activeElement.blur();
});

document.getElementById("key").addEventListener("input", (event) => {
    key = parseInt(event.target.value);
    updateActiveFrequencies(); 
    updateNoteDisplay();
});
document.getElementById("keyDecrease").addEventListener("click", () => {
    keyDecrease();
    document.activeElement.blur();
});
document.getElementById("keyIncrease").addEventListener("click", () => {
    keyIncrease();
    document.activeElement.blur();
});

document.getElementById("waveType").addEventListener("change", (event) => {
    waveType = event.target.value;
});   

document.getElementById("soundMode").addEventListener("change", (event) => {
    soundMode = event.target.value;
});  

window.addEventListener("blur", () => {
    stopAllSounds();
});

window.addEventListener("contextmenu", (event) => {
    stopAllSounds();
});

const controls = document.querySelectorAll(".control input, .control select, .control button");
document.addEventListener("mousemove", (event) => {
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

document.getElementById("pedal").addEventListener("mousedown", () => {
    pressPedal();
});
document.getElementById("pedal").addEventListener("mouseup", () => {
    releasePedal();
});
document.getElementById("pedal").addEventListener("mouseleave", () => {
    releasePedal();
}); 
document.getElementById("pedal").addEventListener("touchstart", () => {
    event.preventDefault(); // prevent the page from scrolling
    pressPedal();
});
document.getElementById("pedal").addEventListener("touchend", () => {
    releasePedal();
});
document.getElementById("pedal").addEventListener("contextmenu", (event) => {
    event.preventDefault();
});