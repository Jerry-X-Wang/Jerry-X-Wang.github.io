// 19-Tone equal temperament

let helpOn = false;

let reference = 440; // Reference frequency
document.getElementById("reference").value = reference;

let octave = 4; // Octave number
document.getElementById("octave").value = octave;

let keyInMusic = 0; // key in music

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
    "q": -33,
    "a": -32,
    "z": -31,

    "w": -30,
    "s": -29,
    "x": -28,

    "e": -27,
    "d": -26,

    "r": -25,
    "f": -24,
    "v": -23,

    "t": -22,
    "g": -21,
    "b": -20,

    "y": -19,
    "h": -18,
    "n": -17,

    "u": -16,
    "j": -15,
    
    "i": -14,
    "k": -13,
    ",": -12,

    "o": -11,
    "l": -10,
    ".": -9,

    "p": -8,
    ";": -7,

    "[": -6,
    "'": -5,
    "/": -4,

    "]": -3,
    "\\": 0,
    "`": 3,
    "1": 5,
    "2": 8,
    "3": 11,
    "4": 13,
    "5": 16,
    "6": 19,
    "7": 22,
    "8": 24,
    "9": 27,
    "0": 30,
    "-": 32,
    "=": 35,

    "Q": -14,
    "A": -13,
    "Z": -12,

    "W": -11,
    "S": -10,
    "X": -9,

    "E": -8,
    "D": -7,

    "R": -6,
    "F": -5,
    "V": -4,

    "T": -3,
    "G": -2,
    "B": -1,

    "Y": 0,
    "H": 1,
    "N": 2,

    "U": 3,
    "J": 4,
    
    "I": 5,
    "K": 6,
    "<": 7,

    "O": 8,
    "L": 9,
    ">": 10,

    "P": 11,
    ":": 12,

    "{": 13,
    "\"": 14,
    "?": 15,

    "}": 16,
    "|": 19,
    "~": 22,
    "!": 24,
    "@": 27,
    "#": 30,
    "$": 32,
    "%": 35,
    "^": 38,
    "&": 41,
    "*": 43,
    "(": 46,
    ")": 49,
    "_": 51,
    "+": 54,
}

const notes = ["A", "A♯", "B♭", "B", "B♯(C♭)", "C", "C♯", "D♭", "D", "D♯", "E♭", "E", "E♯(F♭)", "F", "F♯", "G♭", "G", "G♯", "A♭"]

function toggleHelp() {
    helpOn = !helpOn;
    if (helpOn) {
        document.getElementById("help").style.display = "block";
    } else {
        document.getElementById("help").style.display = "none";
    }
}

function frequency(noteCode) {
    return reference * 2**((noteCode + keyInMusic)/19 + octave - 4);
}

function volumeCurve(rawVolume) {
    return (rawVolume / 2) ** 2;
}

function updateNoteDisplay() {
    let noteNumbers = [];
    for (let noteCode in oscillators) {
        noteCode = parseInt(noteCode);
        noteNumbers.push(noteCode);
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
        display += nameOfNote(noteNumbers[i]) + " " + freq + "\u2006Hz" + "\n";
    }
    document.getElementById("noteDisplay").textContent = display;
}

function nameOfNote(noteCode) {
    return notes[mod(noteCode + keyInMusic, 19)] + (Math.floor((noteCode + keyInMusic + 14) / 19) + octave);
    //     note name                                octave                              ↓
    //                                                                                  14 is because there is 14 semitones between C and A in 19-TET
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
                gainNode.gain.value = volume * (440/freq)**0.5;
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
                gainNode.gain.value = volume * (440/freq)**0.5;
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
    // gainCurve = t => currentGain * (0.5 ** (1 / halfLife)) ** t; // exponential function with given halfLife
    // here we use timeCurve instead of gainCurve in order to improve performance
    const timeCurve = gain => (halfLife * Math.log2(currentGain / gain)); // inverse function of gainCurve

    switch (soundMode) {
        case "piano":
            halfLife = 0.5 * (440/freq)**0.5;

            for (; gain > 0.0001; gain -= 0.0001) { // set the gains from now on, until it's too quiet
                time = timeCurve(gain);
                gainNodes[noteCode].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteCode] = setTimeout(() => {
                if (oscillators[noteCode]) {
                    stopSound(noteCode);
                }
            }, time * 1000);
            break;
        case "bells":
            halfLife = 0.5 * (440/freq)**0.5;

            for (; gain > 0.0001; gain -= 0.0001) { // set the gains from now on, until it's too quiet
                time = timeCurve(gain);
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
    keys.forEach(key => {
        if (key.noteCode == noteCode && !key.classList.contains("active")) {
            key.classList.add("active");
        }
    });
    if (oscillators[noteCode]) {
        stopSound(noteCode); // if the note is already playing, stop the sound first, then we can start the new sound
    }
    activeNotes.add(noteCode);
    playSound(noteCode);
}

function stopNote(noteCode) {
    keys.forEach(key => {
        if (key.noteCode == noteCode && key.classList.contains("active")) {
            key.classList.remove("active");
        }
    });
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
                if (!activeNotes.has(noteCode)) {
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
    refreshKeyNames();
}

function octaveIncrease() {
    octave++;
    document.getElementById("octave").value = octave; 
    updateActiveFrequencies(); 
    updateNoteDisplay();
    refreshKeyNames();
}

function keyDecrease() {
    if (keyInMusic == 0) {
        octave--;
        document.getElementById("octave").value = octave;
        keyInMusic = 18;
    } else {
        keyInMusic--;
    }
    document.getElementById("key").value = keyInMusic;
    updateActiveFrequencies(); 
    updateNoteDisplay();
    refreshKeyNames();
}

function keyIncrease() {
    if (keyInMusic == 18) {
        octave++;
        document.getElementById("octave").value = octave;
        keyInMusic = 0;
    } else {
        keyInMusic++;
    }
    document.getElementById("key").value = keyInMusic;
    updateActiveFrequencies(); 
    updateNoteDisplay();
    refreshKeyNames();
}


window.addEventListener("keydown", (event) => {
    if (event.target.tagName.toLowerCase() === "input") {
        if (event.key === "Enter") {
            event.target.blur();
            return; 
        }
    }
    
    const keyCode = event.key;
    const noteCode = noteCodes[keyCode];
    const freq = frequency(noteCode);
    
    if (freq) {
        if (!activeNotes.has(noteCode)) {
            playNote(noteCode);
        }
    } else {
        switch (keyCode) {
            case "ArrowDown": 
                octaveDecrease();
                event.preventDefault();
                break;
            case "ArrowUp": 
                octaveIncrease();
                event.preventDefault();
                break;
            case "ArrowLeft":
                keyDecrease();
                event.preventDefault();
                break;
            case "ArrowRight":
                keyIncrease();
                event.preventDefault();
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
    refreshKeyNames();
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
    keyInMusic = parseInt(event.target.value);
    updateActiveFrequencies(); 
    updateNoteDisplay();
    refreshKeyNames();
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

window.addEventListener("contextmenu", () => {
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
document.getElementById("pedal").addEventListener("touchstart", (event) => {
    event.preventDefault(); // prevent the page from scrolling
    pressPedal();
});
document.getElementById("pedal").addEventListener("touchend", () => {
    releasePedal();
});
document.getElementById("pedal").addEventListener("contextmenu", (event) => {
    event.preventDefault();
});