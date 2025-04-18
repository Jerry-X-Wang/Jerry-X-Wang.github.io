const canvas = document.getElementById("canvas");
const canvasCtx = canvas.getContext("2d");

// Initialize configuration
let USE_MICROPHONE = true;
let audioContext, mediaStream, source, analyser;

// Get HTML elements
const toggleBtn = document.getElementById("audioToggleBtn");
const btnImage = toggleBtn.querySelector("img");

// Add canvas style
canvas.style.cursor = "pointer";
let showClickPrompt = true;

// Frequency bar configuration
let referenceFreq = 440;  // A4
let minFreq = referenceFreq * (2 ** (1/12)) ** (-2*12 - 0.5);  // A2
let maxFreq = referenceFreq * (2 ** (1/12)) ** (3*12+3 + 0.5);  // C8
console.log(`Reference freq: ${referenceFreq}Hz`);
console.log(`Min freq: ${minFreq}Hz`);
console.log(`Max freq: ${maxFreq}Hz`);
let barCount = 64;
let marginRatio = 0.05;
let logMap = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

document.addEventListener("DOMContentLoaded", function() {
    let timeoutId;
    
    document.addEventListener("mousemove", resetTimer);
    document.addEventListener("mousedown", resetTimer);
    
    function resetTimer() {
        clearTimeout(timeoutId);
        canvas.style.zIndex = 0;
        timeoutId = setTimeout(hideButtons, 1000);
    }
    
    function hideButtons() {
        canvas.style.zIndex = 2;  // Hide buttons after 1 second of no operation
    }
    
    resetTimer();

    // Icon update function
    const updateButtonIcon = () => {
        btnImage.src = USE_MICROPHONE ? "microphone.png" : "system_audio.png";
        btnImage.alt = USE_MICROPHONE ? "Microphone" : "System Audio";
        btnImage.title = USE_MICROPHONE ? "Using Microphone" : "Using System Audio";
    };

    // Audio source management
    const getAudioStream = async () => {
        try {
            if (USE_MICROPHONE) {
                // use microphone
                return await navigator.mediaDevices.getUserMedia({ 
                    audio: { echoCancellation: false, noiseSuppression: false }
                });
            }

            // use system audio
            return await navigator.mediaDevices.getDisplayMedia({ 
                audio: true,
                video: { width: 1, height: 1 }
            });
        } catch (error) {
            console.error("Failed to get audio:", error);
            throw error;
        }
    };

    // Initialize audio analyzer
    const initAnalyser = (stream) => {
        if (audioContext) audioContext.close();
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2 ** 12;
        
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        generateLogMap(audioContext.sampleRate, analyser);
    };

    // Generate logarithmic frequency mapping
    const generateLogMap = (sampleRate, analyser) => {
        logMap = [];
        const bufferLength = analyser.frequencyBinCount;
        
        for(let i = 0; i < barCount; i++) {
            const logStart = minFreq * (maxFreq/minFreq) ** (i/barCount);
            const startFreq = Math.min(logStart, maxFreq);
            const startIndex = Math.round(startFreq * analyser.fftSize / sampleRate);
            const logEnd = minFreq * (maxFreq/minFreq) ** ((i+1)/barCount);
            const endFreq = Math.min(logEnd, maxFreq);
            const endIndex = Math.round(endFreq * analyser.fftSize / sampleRate);
            
            logMap.push({
                startIndex: startIndex,
                endIndex: endIndex,
                startFreq: startFreq,
                endFreq: endFreq
            });
        }
    };

    // Drawing logic
    const draw = () => {
        if (!analyser || audioContext.state !== "running") return;
        
        requestAnimationFrame(draw);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        let x = 0;

        logMap.forEach((band, i) => {
            let sum = 0, count = 0;
            for(let j = band.startIndex; j <= band.endIndex; j++) {
                sum += dataArray[j];
                count++;
            }
            const avgValue = sum / count;

            const barWidth = canvas.width / barCount;
            const barHeight = (avgValue / 255) * canvas.height;

            canvasCtx.fillStyle = `hsl(${(i / barCount) * 240}, 100%, 70%)`;
            canvasCtx.fillRect(
                x + barWidth * marginRatio / 2, 
                canvas.height - barHeight,
                barWidth * (1 - marginRatio),
                barHeight
            );
            x += barWidth;
        });
    };

    // Toggle button handling
    toggleBtn.addEventListener("click", async () => {
        try {
            USE_MICROPHONE = !USE_MICROPHONE;
            updateButtonIcon();
            
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            
            mediaStream = await getAudioStream();
            initAnalyser(mediaStream);
        } catch (error) {
            console.error("Failed to switch source:", error);
            alert("Failed to switch source. Please make sure you are sharing the audio.")
            USE_MICROPHONE = !USE_MICROPHONE;
            mediaStream = await getAudioStream();
            initAnalyser(mediaStream);
            updateButtonIcon();
        }
    });

    // Initialize visualization
    const initVisualization = async () => {
        try {
            // Initialize icon status
            updateButtonIcon();

            // Click prompt
            const drawPrompt = () => {
                if (!showClickPrompt) return;
                canvasCtx.fillStyle = "rgb(0, 0, 0)";
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                canvasCtx.fillStyle = "white";
                canvasCtx.font = "36px Arial";
                canvasCtx.textAlign = "center";
                canvasCtx.textBaseline = "middle";
                canvasCtx.fillText("Click to start", canvas.width/2, canvas.height/2);
                requestAnimationFrame(drawPrompt);
            };
            drawPrompt();

            // Wait for user click
            await new Promise(resolve => {
                canvas.addEventListener("click", () => {
                    showClickPrompt = false;
                    canvas.style.cursor = "default";
                    resolve();
                }, { once: true });
            });
            
            // Initialize audio
            mediaStream = await getAudioStream();
            initAnalyser(mediaStream);
            draw();
        } catch (error) {
            console.error("Initialization Failed", error);
            alert("Initialization failed")
        }
    };

    initVisualization();
});
