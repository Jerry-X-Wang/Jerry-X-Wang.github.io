let reference = Number(document.getElementById("reference").value); // Reference frequency

let octave = Number(document.getElementById("octave").value); // Octave number

let keyInMusic = 0; // key in music

let waveType = document.getElementById("waveType").value; // Wave type: sine, square, sawtooth, or triangle

let soundMode = document.getElementById("soundMode").value; // Sound mode: piano, strings, or bells

let pedal = false; // Whether the pedal is pressed or not

const piano = document.getElementById("piano");

const notes = ["C", "C♯(D♭)", "D", "D♯(E♭)", "E", "F", "F♯(G♭)", "G", "G♯(A♭)", "A", "A♯(B♭)", "B"]

// use midi note number: 60 -> C4
const startNote = 21; // A0
const endNote = 108; // C8
let whiteKeyWidth = 60; // pixel width of a white key
let borderWidth = 2; // pixel width of key border
const offset = -Math.floor(((startNote + 8) * (5/12)*whiteKeyWidth) / whiteKeyWidth) * whiteKeyWidth; // offset of the keyboard from the left edge of the piano (Math.floor is to round down to the nearest multiple of whiteKeyWidth)
// in the following arrays, 0 -> C
const whiteKeyNumbers = [0, 2, 4, 5, 7, 9, 11];
const blackKeyNumbers = [1, 3, 6, 8, 10];
let keys;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillators = {};
const gainNodes = {}; 
const activeNotes = new Set();
const timeoutStopSound = {};

const keyMap = { // 60 -> C4
    
}

function keyPosition(noteNumber) {
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
            console.error("Invalid noteNumber");
            break;
    }
    position += whiteKeyWidth * (7*Math.floor(noteNumber/12)) + offset;
    return position;
    // if ([0, 2, 4].includes(mod(noteNumber, 12))) {
    //     return whiteKeyWidth/2 * (noteNumber + 2*Math.floor(noteNumber/12)) + offset;

    // } else if ([5, 7, 9, 11].includes(mod(noteNumber, 12))) {
    //     return whiteKeyWidth/2 * (noteNumber + 2*Math.floor(noteNumber/12) + 1) + offset;

    // } else if ((mod(noteNumber, 12)) == 1) {
    //     return whiteKeyWidth * (7*Math.floor(noteNumber/12)) + offset;
    // }
}

function removeAllActiveKeys() {
    keys.forEach(key => {
        if (key.classList.contains("active")) {
            key.classList.remove("active");
        }
    });
}

function refreshKeyNames() {
    keys.forEach(key => {
        key.innerText = noteName(key.noteNumber);
    });
}

function noteName(noteNumber) {
    return notes[mod(noteNumber + keyInMusic, 12)] + (Math.floor((noteNumber + keyInMusic) / 12) + octave - 5);
    //     note name                                  octave
}

function keyName(noteNumber) {
    let keyName = noteName(noteNumber);
    if (keyName.includes("(")) { // change name like E♯(F♭)4 into E♯4 \n F♭4
        const octave = keyName.slice(-1);
        keyName = keyName.slice(0, keyName.indexOf("(")) + octave + "\n" +
            keyName.slice(keyName.indexOf("(") + 1, keyName.indexOf(")")) + octave;
    }
    return keyName;
}

function frequency(noteNumber) {
    return reference * 2**((noteNumber + keyInMusic - 69)/12 + octave - 4);
}

function volumeCurve(rawVolume) {
    return (rawVolume / 2) ** 2;
}

function playSound(noteNumber) {
    const freq = frequency(noteNumber);
    
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodes[noteNumber] = gainNode;
    const volume = volumeCurve(Number(document.getElementById("volume").value))
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
    oscillators[noteNumber] = oscillator;

    //updateNoteDisplay();

    const currentGain = gainNodes[noteNumber].gain.value;
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
                gainNodes[noteNumber].gain.setValueAtTime(gain, currentTime + time);
            }

            timeoutStopSound[noteNumber] = setTimeout(() => {
                if (oscillators[noteNumber]) {
                    stopSound(noteNumber);
                }
            }, time * 1000);
            break;
        case "bells":
            halfLife = 0.5 * (440/freq)**0.5;

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
        case "strings":
            gainNodes[noteNumber].gain.setValueAtTime(0.7 * currentGain, currentTime);
            break;
        default:
            oscillators[noteNumber].stop(currentTime);
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    } 
}

function stopSound(noteNumber) {
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
    //updateNoteDisplay();
}

function stopAllSounds() {
    for (let noteNumber in oscillators) {
        noteNumber = parseInt(noteNumber);
        stopSound(noteNumber);
    }
}

function playNote(noteNumber) {
    keys.forEach(key => {
        if (key.noteNumber == noteNumber && !key.classList.contains("active")) {
            key.classList.add("active");
        }
    });
    if (oscillators[noteNumber]) {
        stopSound(noteNumber); // if the note is already playing, stop the sound first, then we can start the new sound
    }
    activeNotes.add(noteNumber);
    playSound(noteNumber);
}

function stopNote(noteNumber) {
    keys.forEach(key => {
        if (key.noteNumber == noteNumber && key.classList.contains("active")) {
            key.classList.remove("active");
        }
    });
    switch (soundMode) {
        case "piano":
        case "strings":
            if (!pedal) {
                if (oscillators[noteNumber]) {
                    stopSound(noteNumber);
                }
            }
            break;
        case "bells":
            break;
        default:
            console.error(`Invalid sound mode: ${soundMode}`);
            break;
    }
    
    if (activeNotes.has(noteNumber)) {
        activeNotes.delete(noteNumber);
        //updateNoteDisplay();
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
            for (let noteNumber in oscillators) {
                noteNumber = parseInt(noteNumber);
                if (!activeNotes.has(noteNumber)) {
                    stopSound(noteNumber);
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

document.getElementById("key").addEventListener("input", function() {
    refreshKeyNames();
});


window.addEventListener("resize", function() {
    windowHeight = window.innerHeight;
    restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
    document.getElementById("panel").style.height = `${restHeight}px`;
    document.getElementById("canvas").style.height = `${restHeight}px`;
});

window.addEventListener("blur", () => {
    removeAllActiveKeys();
});

window.addEventListener("contextmenu", () => {
    removeAllActiveKeys();
});


function init() {
    // create keys
    for (let noteNumber = startNote; noteNumber <= endNote; noteNumber++) {
        // noteNumber, 60 -> C4
        const key = document.createElement("div");
        piano.appendChild(key);
        key.noteNumber = noteNumber;

        const span = document.createElement("span");
        span.innerText = keyName(noteNumber);
        key.appendChild(span);

        if (whiteKeyNumbers.includes(mod(noteNumber, 12))) { // white keys
            key.style.left = `${keyPosition(noteNumber)}px`;
            key.style.border = `${borderWidth}px solid #bbb`;
            key.classList.add("white-key");
            const keyWidth = whiteKeyWidth - 2*borderWidth;
            key.style.width = `${keyWidth}px`;

            span.style.position = "absolute";
            span.style.width = `${keyWidth}px`;
            switch (mod(noteNumber, 12)) {
                case 0:
                case 5:
                    span.style.left = "-20%";
                    break;
                case 4:
                case 11:
                    span.style.left = "20%";
                    break;
                case 7:
                    span.style.left = "-7%";
                    break;
                case 9:
                    span.style.left = "7%";
                    break
                default:
                    span.style.left = "0";
                    break;
            }

        } else if (blackKeyNumbers.includes(mod(noteNumber, 12))) { // black keys
            key.style.left = `${keyPosition(noteNumber) - borderWidth}px`;
            key.style.border = `${borderWidth}px solid #bbb`;
            key.classList.add("black-key");
            const keyWidth = whiteKeyWidth*7/12;
            key.style.width = `${keyWidth}px`;

        } else {
            console.error(`Invalid key index: ${noteNumber}`);
        }
    }

    let windowHeight = window.innerHeight;
    const margin = 70;
    const pianoHeight = document.getElementsByClassName("piano-container")[0].clientHeight;
    const pedalHeight = document.getElementById("pedal").clientHeight;
    const titleHeight = document.getElementsByClassName("title")[0].clientHeight;
    let restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
    document.getElementById("panel").style.height = `${restHeight}px`;
    document.getElementById("canvas").style.height = `${restHeight}px`;

    // set the scroll bar to the center
    const pianoContainer = document.getElementsByClassName("piano-container")[0];
    const keysWidth = piano.scrollWidth; 
    const containerWidth = pianoContainer.clientWidth; 
    const scrollPosition = (keysWidth - containerWidth) / 2; 
    pianoContainer.scrollLeft = scrollPosition; 

    keys = document.querySelectorAll(".white-key, .black-key");

    pianoContainer.addEventListener("wheel", function(event) {
        pianoContainer.scrollBy({
            left: event.deltaY,
        });
    });

    keys.forEach(key => {
        key.addEventListener("touchstart", function(event) {
            event.preventDefault(); // prevent the page from scrolling
            const noteNumber = parseInt(key.noteNumber);
            playNote(noteNumber);
        });

        key.addEventListener("touchend", function() {
            const noteNumber = parseInt(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener("touchleave", function() {
            const noteNumber = parseInt(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener("mousedown", function() {
            const noteNumber = parseInt(key.noteNumber);
            playNote(noteNumber);
        });

        key.addEventListener("mouseup", function() {
            const noteNumber = parseInt(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener("mouseleave", function() {
            const noteNumber = parseInt(key.noteNumber);
            stopNote(noteNumber);
        });

        key.addEventListener("mousemove", function(event) {
            if (event.buttons == 1 && !key.classList.contains("active")) { // left mouse button is down
                const noteNumber = parseInt(key.noteNumber);
                playNote(noteNumber);
            }
        });

        key.addEventListener("contextmenu", function(event) {
            event.preventDefault(); // prevent the default context menu from appearing
        });
    });
}

document.addEventListener('DOMContentLoaded', init);