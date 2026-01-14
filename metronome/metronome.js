let bpm = 120;
let beatsPerMeasure = 4;
let beatTypes = ['normal', 'stressed', 'accented', 'disabled'];
let currentBeatTypes = new Array(beatsPerMeasure).fill(0); // 0: normal, 1: stressed, 2: accented, 3: disabled
let currentBeat = 0;
let intervalId = null;
let isPlaying = false;

const bpmSlider = document.getElementById('bpm-slider');
const bpmInput = document.getElementById('bpm-input');
const bpmMinus = document.getElementById('bpm-minus');
const bpmPlus = document.getElementById('bpm-plus');
const beatsInput = document.getElementById('beats-input');
const beatDotsContainer = document.getElementById('beat-dots');
const startStopButton = document.getElementById('start-stop');

const normalBeat = 'audio/normal_beat.ogg';
const stressedBeat = 'audio/stressed_beat.ogg';
const accentedBeat = 'audio/accented_beat.ogg';

let timer;
let previousTime;
let timeInterval;

function init() {
    bpmInput.value = bpm;
    bpmSlider.value = bpm;
    updateBeatsPerMeasure();
    setupEventListeners();
}

function setupEventListeners() {
    bpmSlider.addEventListener('input', updateBPMFromSlider);
    bpmInput.addEventListener('blur', updateBPMFromInput);
    bpmInput.addEventListener('keydown', (event) => {
        if (event.key == "Enter") {
            bpmInput.blur();
        }
    })
    bpmMinus.addEventListener('click', () => adjustBPM(-1));
    bpmPlus.addEventListener('click', () => adjustBPM(1));
    beatsInput.addEventListener('input', updateBeatsPerMeasure);
    beatsInput.addEventListener('change', updateBeatsPerMeasure);
    startStopButton.addEventListener('click', togglePlay);
}

function updateBPMFromSlider() {
    bpm = parseInt(bpmSlider.value);
    updateBPM();
}

function updateBPMFromInput() {
    const newBPM = parseInt(bpmInput.value);
    if (newBPM >= bpmInput.min && newBPM <= bpmInput.max) {
        bpm = newBPM;
        bpmSlider.value = bpm;
        updateBPM();
    }
}

function adjustBPM(delta) {
    bpm = Math.max(bpmInput.min, Math.min(bpmInput.max, bpm + delta));
    bpmSlider.value = bpm;
    bpmInput.value = bpm;
    updateBPM();
}

function updateBPM() {
    bpmInput.value = bpm;
    bpmSlider.value = bpm;
    timeInterval = 60000 / bpm;
}

function updateBeatsPerMeasure() {
    if (beatsInput.value == '') {return};
    currentBeat = 0;
    beatsPerMeasure = parseInt(beatsInput.value);
    let loop = 0;
    while (beatDotsContainer.children.length != beatsPerMeasure && loop < 1000) {
        if (beatDotsContainer.children.length < beatsPerMeasure) {
            addBeatDot();
        } else {
            removeLastBeatDot();
        }
        loop++;
    }
    if (loop >= 1000){
        console.error('Failed to add or remove beat dots')
    }
}

function addBeatDot() {
    const index = beatDotsContainer.children.length;
    const dot = document.createElement('div');
    currentBeatTypes[index] = 0;
    dot.className = 'beat-dot ' + beatTypes[currentBeatTypes[index]];
    dot.addEventListener('mousedown', (event) => {
        switch (event.button) {
            case 0:
                cycleBeatType(index, 1);
                break;
            case 1:
                dot.className = 'beat-dot normal';
                currentBeatTypes[index] = 0;
                break;
            case 2:
                cycleBeatType(index, -1);
                break;
            default:
                break;
        }
    });
    dot.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    })
    beatDotsContainer.appendChild(dot);
}

function removeLastBeatDot() {
    beatDotsContainer.lastElementChild.remove();
}

function cycleBeatType(index, addition=1) {
    currentBeatTypes[index] = (currentBeatTypes[index] + addition + beatTypes.length) % beatTypes.length;
    //                                                              ↑ here is to prevent negetive number 
    const dot = beatDotsContainer.children[index];
    dot.className = 'beat-dot ' + beatTypes[currentBeatTypes[index]];
}

function togglePlay() {
    if (isPlaying) {
        stop();
    } else {
        start();
    }
    startStopButton.blur();
}

function start() {
    clearTimeout(timer);
    currentBeat = 0;
    isPlaying = true;
    beat();
    startStopButton.textContent = 'Stop';
}

function stop() {
    clearTimeout(timer);
    isPlaying = false;
    startStopButton.textContent = 'Start';
    clearActiveDots();
}

function playAudio(audio_src) {
    const audio = new Audio(audio_src);
    audio.play();
}

function beat() {
    updateActiveDot();
    playBeat();
    currentBeat = (currentBeat + 1) % beatsPerMeasure;
    timer = setTimeout(beat, timeInterval);
}

function playBeat() {
    const beatType = beatTypes[currentBeatTypes[currentBeat]];
    switch (beatType) {
        case 'stressed':
            playAudio(normalBeat);
            playAudio(stressedBeat);
            break;
        case 'accented':
            playAudio(normalBeat);
            playAudio(accentedBeat);
            break;
        case 'disabled':
            break;
        default:
            playAudio(normalBeat);
            break;
    }
}

function updateActiveDot() {
    clearActiveDots();
    if (beatDotsContainer.children[currentBeat]) {
        beatDotsContainer.children[currentBeat].classList.add('active');
    }
}

function clearActiveDots() {
    for (let dot of beatDotsContainer.children) {
        dot.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case " ":
            togglePlay();
            break;
        default:
            break;
    }
});
