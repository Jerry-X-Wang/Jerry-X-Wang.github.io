function keyPosition(noteCode) {
    if ([0, 3, 6].includes(mod(noteCode, 19))) {
        return whiteKeyWidth/3 * (noteCode + 2*Math.floor(noteCode/19)) + offset;

    } else if ([2, 5, 8, 11, 14, 17].includes(mod(noteCode, 19))) {
        return whiteKeyWidth/3 * (noteCode + 2*Math.floor(noteCode/19) + 1) + offset;

    } else if ([1, 4, 7, 10, 13, 16].includes(mod(noteCode, 19))) {
        return whiteKeyWidth/3 * (noteCode + 2*Math.floor(noteCode/19) + 2) + offset;
      
    } else if ([9, 12, 15, 18].includes(mod(noteCode, 19))) {
        return whiteKeyWidth/3 * (noteCode + 2*Math.floor(noteCode/19) + 3) + offset;
    }
}

function removeAllActiveKeys() {
    keys.forEach(key => {
        if (key.classList.contains("active")) {
            key.classList.remove("active");
        }
    });
}

function keyName(noteCode) {
    let keyName = nameOfNote(noteCode);
    if (keyName.includes("(")) { // change name like E♯(F♭)4 into E♯4 \n F♭4
        const octave = keyName.slice(-1);
        keyName = keyName.slice(0, keyName.indexOf("(")) + octave + "\n" +
            keyName.slice(keyName.indexOf("(") + 1, keyName.indexOf(")")) + octave;
    }
    return keyName;
}

function refreshKeyNames() {
    keys.forEach(key => {
        key.innerText = keyName(key.noteCode);
    });
}

const piano = document.getElementById("piano");

// for startNote and endNote, 0 -> A4
const startNote = -76;
const endNote = 62;
let whiteKeyWidth = 60; // pixel width of a white key
let borderWidth = 2; // pixel width of key border
const offset = -Math.floor(((startNote+14) * (7/19)*whiteKeyWidth) / whiteKeyWidth) * whiteKeyWidth; // offset of the keyboard from the left edge of the piano (Math.floor is to round down to the nearest multiple of whiteKeyWidth)
// in the following 3 arrays, 0 -> C, not A!!!
const whiteKeys = [0, 3, 6, 8, 11, 14, 17];
const blackKeys = [1, 4, 9, 12, 15];
const greyKeys = [2, 5, 7, 10, 13, 16, 18];

// create keys
for (let noteCode = startNote; noteCode <= endNote; noteCode++) {
    // for noteCode, 0 -> A4; for i, 0 -> C4
    i = noteCode + 14; // 14 is because there are 14 semitones between C and A
    const key = document.createElement("div");
    piano.appendChild(key);
    key.style.left = `${keyPosition(i)}px`;
    key.style.border = `${borderWidth}px solid #bbb`;
    key.noteCode = noteCode;
    key.innerText = keyName(noteCode);

    if (whiteKeys.includes(mod(i, 19))) { // white keys

        key.classList.add("white-key");
        const keyWidth = whiteKeyWidth - 2*borderWidth;
        key.style.width = `${keyWidth}px`;

    } else if (blackKeys.includes(mod(i, 19))) { // black keys

        key.classList.add("black-key");
        const keyWidth = whiteKeyWidth/2 - borderWidth;
        key.style.width = `${keyWidth}px`;
        key.style.marginLeft = `${-(keyWidth/2 + borderWidth)}px`;

    } else if (greyKeys.includes(mod(i, 19))){ // grey keys

        key.classList.add("grey-key");
        const keyWidth = whiteKeyWidth/2 - borderWidth;
        key.style.width = `${keyWidth}px`;
        key.style.marginLeft = `${-(keyWidth/2 + borderWidth)}px`;
        
    } else {
        console.error(`Invalid key index: ${i}`);
    }
}

let windowHeight = window.innerHeight;
const margin = 70;
const pianoHeight = document.getElementsByClassName("piano-container")[0].clientHeight;
const pedalHeight = document.getElementById("pedal").clientHeight;
const titleHeight = document.getElementsByClassName("title")[0].clientHeight;
let restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
document.getElementById("panel").style.height = `${restHeight}px`;
document.getElementsByClassName("display")[0].style.height = `${restHeight}px`;

// set the scroll bar to the center
const pianoContainer = document.getElementsByClassName("piano-container")[0];
const keysWidth = piano.scrollWidth; 
const containerWidth = pianoContainer.clientWidth; 
const scrollPosition = (keysWidth - containerWidth) / 2; 
pianoContainer.scrollLeft = scrollPosition; 

const keys = document.querySelectorAll(".white-key, .black-key, .grey-key");

pianoContainer.addEventListener("wheel", function(event) {
    pianoContainer.scrollBy({
        left: event.deltaY,
    });
});

document.getElementById("key").addEventListener("input", function() {
    refreshKeyNames();
});

keys.forEach(key => {
    key.addEventListener("touchstart", function(event) {
        event.preventDefault(); // prevent the page from scrolling
        const noteCode = parseInt(key.noteCode);
        playNote(noteCode);
        console.log(`Touch start on key ${noteCode}`);
    });

    key.addEventListener("touchend", function() {
        const noteCode = parseInt(key.noteCode);
        stopNote(noteCode);
        console.log(`Touch end on key ${noteCode}`);
    });

    key.addEventListener("touchleave", function() {
        const noteCode = parseInt(key.noteCode);
        stopNote(noteCode);
    });

    key.addEventListener("mousedown", function() {
        const noteCode = parseInt(key.noteCode);
        playNote(noteCode);
    });

    key.addEventListener("mouseup", function() {
        const noteCode = parseInt(key.noteCode);
        stopNote(noteCode);
    });

    key.addEventListener("mouseleave", function() {
        const noteCode = parseInt(key.noteCode);
        stopNote(noteCode);
    });

    key.addEventListener("mousemove", function(event) {
        if (event.buttons == 1 && !key.classList.contains("active")) { // left mouse button is down
            const noteCode = parseInt(key.noteCode);
            playNote(noteCode);
        }
    });

    key.addEventListener("contextmenu", function(event) {
        event.preventDefault(); // prevent the default context menu from appearing
    });
});

window.addEventListener("resize", function() {
    windowHeight = window.innerHeight;
    restHeight = windowHeight - pianoHeight - pedalHeight - titleHeight - margin
    document.getElementById("panel").style.height = `${restHeight}px`;
    document.getElementsByClassName("display")[0].style.height = `${restHeight}px`;
});

window.addEventListener("blur", () => {
    removeAllActiveKeys();
});

window.addEventListener("contextmenu", () => {
    removeAllActiveKeys();
});