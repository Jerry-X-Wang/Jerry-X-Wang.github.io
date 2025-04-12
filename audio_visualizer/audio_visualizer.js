// Create audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Get full-screen canvas element
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

// Set full-screen dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Logarithmic parameter configuration
const LOG_BASE = 20;
const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const NUM_BARS = 16;

// Execute after the page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    
    let mediaStream;

    // Initialize visualization
    const initVisualization = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(mediaStream);
            const analyser = audioContext.createAnalyser();

            source.connect(analyser);
            analyser.fftSize = 2 ** 12;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Pre-calculate logarithmic mapping table
            const logMap = [];
            const sampleRate = audioContext.sampleRate;
            
            // Generate frequency mapping table
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

            // Draw function
            const draw = () => {
                requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                // Clear canvas
                canvasCtx.fillStyle = "rgb(0, 0, 0)";
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

                const totalLogWidth = Math.log10(MAX_FREQ/MIN_FREQ);
                let x = 0;

                // Visualization rendering
                const renderBars = () => {
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
                        canvasCtx.fillRect(x + barWidth * marginRatio / 2, canvas.height - barHeight, barWidth * (1-marginRatio), barHeight);
                        x += barWidth;
                    }
                }

                renderBars();
            }

            generateLogMap();
            draw();
        } catch (error) {
            console.error("Initialization Failed", error);
        }
    }

    // Start visualization process
    initVisualization();
});

document.addEventListener("DOMContentLoaded", function() {
    let homeLink = document.querySelector('a[title="Home"]');
    let homeImg = homeLink.querySelector('img');
    let timeoutId;

    // Reset timer and show image when user interacts with the page
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('mousedown', resetTimer);

    // Initialize timer
    function resetTimer() {
        clearTimeout(timeoutId);
        // Show image again
        homeImg.style.display = 'block';
        // Set new timer
        timeoutId = setTimeout(hideHomeImg, 1000);  // 1000ms
    }

    function hideHomeImg() {
        homeImg.style.display = 'none';
    }

    // Initialize timer
    resetTimer();
});
