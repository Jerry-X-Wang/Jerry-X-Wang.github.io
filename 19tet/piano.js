function keyPosition(noteCode, offset) {
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

const piano = document.getElementById("piano");

// for startNote and endNote, 0 -> A4
const startNote = -76;
const endNote = 62;
let whiteKeyWidth = 60; // pixel width of a white key
let borderWidth = 2; // pixel width of key border
// in the following 3 arrays, 0 -> C, not A!!!
const whiteKeys = [0, 3, 6, 8, 11, 14, 17];
const blackKeys = [1, 4, 9, 12, 15];
const greyKeys = [2, 5, 7, 10, 13, 16, 18];

// create keys
for (let noteCode = startNote; noteCode <= endNote; noteCode++) {
    // for noteCode, 0 -> A4; for i, 0 -> C4
    i = noteCode + 14; // 14 is because there are 14 semitones between C and A
    // offset of the key from the left edge of the piano (Math.floor is to round down to the nearest multiple of whiteKeyWidth)
    const offset = -Math.floor(((startNote+14) * (7/19)*whiteKeyWidth) / whiteKeyWidth) * whiteKeyWidth; 
    const key = document.createElement("div");
    piano.appendChild(key);
    key.style.left = `${keyPosition(i, offset)}px`;
    key.style.border = `${borderWidth}px solid #bbb`;
    key.innerText = noteCode;

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

// set the scroll bar to the center
const pianoContainer = document.getElementsByClassName("piano-container")[0];
const keysWidth = piano.scrollWidth; 
const containerWidth = pianoContainer.clientWidth; 
const scrollPosition = (keysWidth - containerWidth) / 2; 
pianoContainer.scrollLeft = scrollPosition; 

const keys = document.querySelectorAll(".white-key, .black-key, .grey-key");

keys.forEach(key => {
    key.addEventListener("touchstart", function(event) {
        event.preventDefault(); // prevent the page from scrolling
        key.classList.add("active");
    });

    key.addEventListener("touchend", function() {
        key.classList.remove("active");
    });

    key.addEventListener("mousedown", function() {
        key.classList.add("active");
    });

    key.addEventListener("mouseup", function() {
        key.classList.remove("active");
    });

    // 防止鼠标按住状态下仍然触发其他事件
    key.addEventListener("mouseleave", function() {
        key.classList.remove("active");
    });
});