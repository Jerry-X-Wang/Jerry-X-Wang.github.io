const canvas = document.getElementById('canvas');
const canvasCtx = canvas.getContext('2d');

// Add click activation prompt style
canvas.style.cursor = 'pointer';
let showClickPrompt = true;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// bars configuration
const MIN_FREQ = 106;
const MAX_FREQ = 4310;
const NUM_BARS = 64;

// Unified DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", function() {
    // Home link logic
    let homeLink = document.querySelector('a[title="Home"]');
    let homeImg = homeLink.querySelector('img');
    let timeoutId;

    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('mousedown', resetTimer);

    function resetTimer() {
        clearTimeout(timeoutId);
        homeImg.style.display = 'block';
        timeoutId = setTimeout(hideHomeImg, 1000);
    }

    function hideHomeImg() {
        homeImg.style.display = 'none';
    }

    resetTimer();

    // Audio visualization logic
    const initVisualization = async () => {
        try {
            // Display initial click prompt
            const drawPrompt = () => {
                if (!showClickPrompt) return;
                canvasCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                canvasCtx.fillStyle = "white";
                canvasCtx.font = "24px Arial";
                canvasCtx.textAlign = "center";
                canvasCtx.textBaseline = "middle";
                canvasCtx.fillText("Click to start", canvas.width/2, canvas.height/2);
                requestAnimationFrame(drawPrompt);
            };
            drawPrompt();

            // Wait for user click
            await new Promise(resolve => {
                canvas.addEventListener('click', () => {
                    showClickPrompt = false;
                    resolve();
                }, { once: true });
            });
            
            // Remove click prompt
            canvas.style.cursor = 'default';
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Initialize audio context after user interaction
            let audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(mediaStream);
            const analyser = audioContext.createAnalyser();

            source.connect(analyser);
            analyser.fftSize = 2 ** 13;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Frequency mapping configuration
            const logMap = [];
            const sampleRate = audioContext.sampleRate;
            
            const generateLogMap = () => {
                for(let i = 0; i < NUM_BARS; i++) {
                    const logPosition = MIN_FREQ * (MAX_FREQ/MIN_FREQ) ** ((i+1) / NUM_BARS);
                    const freq = Math.min(logPosition, MAX_FREQ);
                    const index = Math.round(freq * analyser.fftSize / sampleRate);
                    
                    logMap.push({
                        startIdx: i === 0 ? 0 : logMap[i-1].endIdx + 1,
                        endIdx: Math.min(index, bufferLength - 1),
                        endFreq: freq
                    });
                }
            }

            const draw = () => {
                if (!audioContext || audioContext.state !== 'running') return;
                
                requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                canvasCtx.fillStyle = "rgb(0, 0, 0)";
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

                const totalLogWidth = Math.log10(MAX_FREQ/MIN_FREQ);
                let x = 0;

                for(let i = 0; i < NUM_BARS; i++) {
                    let sum = 0, count = 0;
                    for(let j = logMap[i].startIdx; j <= logMap[i].endIdx; j++) {
                        sum += dataArray[j];
                        count++;
                    }
                    const avgValue = sum / count || 0;

                    const widthRatio = (Math.log10(logMap[i].endFreq) - 
                                      (i === 0 ? Math.log10(MIN_FREQ) : Math.log10(logMap[i-1].endFreq))) / totalLogWidth;
                    
                    const barWidth = widthRatio * canvas.width;
                    const barHeight = (avgValue / 255) * canvas.height;

                    const marginRatio = 0.02;
                    canvasCtx.fillStyle = `hsl(${(i / NUM_BARS) * 240}, 100%, 70%)`;
                    canvasCtx.fillRect(x + barWidth * marginRatio / 2, canvas.height - barHeight, 
                                     barWidth * (1-marginRatio), barHeight);
                    x += barWidth;
                }
            }

            generateLogMap();
            draw();
        } catch (error) {
            console.error("Initialization Failed", error);
        }
    }

    initVisualization();
});
