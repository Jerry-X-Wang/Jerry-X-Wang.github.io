let timestamps = [];
let customBeats = 32;

function init() {
    document.getElementById("tap").style.height = window.innerHeight/3 + "px";
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
    document.getElementById("bpm").innerHTML = `
        BPM Current:     0 <br>
        BPM in 4 Beats:  0 <br>
        BPM in 16 Beats: 0 <br>
        BPM in <input type="number" class="input" id="customBeats" value="${customBeats}" step=1 min=1> Beats: 0 <br>
        BPM Overall:     0 <br>
    `;
    document.getElementById("customBeats").addEventListener("input", (event) => {
        customBeats = parseInt(event.target.value);
    });
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
    document.getElementById("bpm").innerHTML = `
        BPM Current:     ${calculateBPM(1).toFixed(0)} <br>
        BPM in 4 Beats:  ${calculateBPM(4).toFixed(0)} <br>
        BPM in 16 Beats: ${calculateBPM(16).toFixed(0)} <br>
        BPM in <input type="number" class="input" id="customBeats" value="${customBeats}" step=1 min=1> Beats: ${calculateBPM(customBeats).toFixed(0)} <br>
        BPM Overall:     ${calculateBPM(timestamps.length - 1).toFixed(Math.max(0, Math.floor(Math.log10(timestamps.length)) - 1))} <br>
    `;
    document.getElementById("customBeats").addEventListener("input", (event) => {
        customBeats = parseInt(event.target.value);
    });
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
        switch (event.key) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
            case "0":
            case "Delete":
            case "Backspace":
                return;
            default:
                break;
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

reset();
init();