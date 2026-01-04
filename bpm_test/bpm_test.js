let timestamps = [];
let customBeats = 32;
let bpmCurrent, bpm4, bpm16, customBeatsInput, bpmCustom, bpmOverall;

function init() {
    document.getElementById("tap").style.height = window.innerHeight/3 + "px";
    reset();
}

function tap() {
    const now = performance.now();
    timestamps.push(now);
    updateBPM();
}

function pressTap() {
    document.getElementById("tap").classList.add("active");
    tap();
}

function releaseTap() {
    document.getElementById("tap").classList.remove("active");
}

function reset() {
    timestamps = [];
    bpmCurrent = document.getElementById("bpmCurrent");
    bpm4 = document.getElementById("bpm4");
    bpm16 = document.getElementById("bpm16");
    bpmCustom = document.getElementById("bpmCustomValue");
    bpmOverall = document.getElementById("bpmOverall");

    customBeatsInput = document.getElementById("customBeats");

    bpmCurrent.textContent = "0";
    bpm4.textContent = "0";
    bpm16.textContent = "0";
    bpmCustom.textContent = "0";
    bpmOverall.textContent = "0";

    customBeatsInput.value = customBeats;

    if (!customBeatsInput.hasEventListener) {
        customBeatsInput.addEventListener("input", (event) => {
            customBeats = parseInt(event.target.value);
            updateBPM();
        });
        customBeatsInput.hasEventListener = true;
    }

    document.getElementById("reset").blur();
}

function pressReset() {
    document.getElementById("reset").classList.add("active");
    reset();
}

function releaseReset() {
    document.getElementById("reset").classList.remove("active");
}

function updateBPM() {
    bpmCurrent.textContent = calculateBPM(1).toFixed(0);
    bpm4.textContent = calculateBPM(4).toFixed(0);
    bpm16.textContent = calculateBPM(16).toFixed(0);
    bpmCustom.textContent = calculateBPM(customBeats).toFixed(0);
    bpmOverall.textContent = calculateBPM(timestamps.length - 1).toFixed(Math.max(0, Math.floor(Math.log10(timestamps.length)) - 1));

    customBeatsInput.value = customBeats;
}

function calculateBPM(beatCount) {
    if (beatCount >= 1 && timestamps[timestamps.length - 1 - beatCount]) {
        return 60000 / (timestamps[timestamps.length - 1] - timestamps[timestamps.length - 1 - beatCount]) * beatCount;
    } else {
        return 0;
    }
}

function handlePress(event) {
    event.preventDefault();
    tap()
}

document.addEventListener("DOMContentLoaded", function() {
    let button = document.querySelector("button");
    button.addEventListener("pointerdown", handlePress);
});


window.addEventListener("keydown", (event) => {
    if (document.activeElement == document.getElementById("customBeats")) {
        if (!(event.key >=0 || event.key <= 9)) {
            switch (event.key) {
                case "Delete":
                case "Backspace":
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                    return;
                default:
                    customBeatsInput.blur();
                    if (parseInt(customBeatsInput.value) >= 1) {
                        customBeats = parseInt(customBeatsInput.value)
                    } else {
                        customBeats = 1;
                    }
                    break;
            }
        }
    }

    switch (event.key) {
        case "Escape":
            pressReset();
            break;
        case "F1":
        case "F2":
        case "F3":
        case "F4":
        case "F5":
        case "F6":
        case "F7":
        case "F8":
        case "F9":
        case "F10":
        case "F11":
        case "F12":
            break;
        default:
            pressTap();
            break;
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "Escape":
            releaseReset();
            break;
        case "F1":
        case "F2":
        case "F3":
        case "F4":
        case "F5":
        case "F6":
        case "F7":
        case "F8":
        case "F9":
        case "F10":
        case "F11":
        case "F12":
            break;
        default:
            releaseTap();
            break;
    }
});

window.addEventListener("blur", () => {
    releaseTap();
    releaseReset();
});

window.addEventListener("resize", init);

init();