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
const MIN_FREQ = 106;
const MAX_FREQ = 4310;
const NUM_BARS = 64;
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
        analyser.fftSize = 2 ** 13;
        
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        generateLogMap(audioContext.sampleRate, analyser);
    };

    // Generate logarithmic frequency mapping
    const generateLogMap = (sampleRate, analyser) => {
        logMap = [];
        const bufferLength = analyser.frequencyBinCount;
        
        for(let i = 0; i < NUM_BARS; i++) {
            const logPosition = MIN_FREQ * (MAX_FREQ/MIN_FREQ) ** ((i+1)/NUM_BARS);
            const freq = Math.min(logPosition, MAX_FREQ);
            const index = Math.round(freq * analyser.fftSize / sampleRate);
            
            logMap.push({
                startIdx: i === 0 ? 0 : logMap[i-1].endIdx + 1,
                endIdx: Math.min(index, bufferLength - 1),
                endFreq: freq
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

        const totalLogWidth = Math.log10(MAX_FREQ/MIN_FREQ);
        let x = 0;

        logMap.forEach((band, i) => {
            let sum = 0, count = 0;
            for(let j = band.startIdx; j <= band.endIdx; j++) {
                sum += dataArray[j];
                count++;
            }
            const avgValue = sum / count || 0;

            const widthRatio = (Math.log10(band.endFreq) - 
                              (i === 0 ? Math.log10(MIN_FREQ) : Math.log10(logMap[i-1].endFreq))) / totalLogWidth;
            
            const barWidth = widthRatio * canvas.width;
            const barHeight = (avgValue / 255) * canvas.height * 0.9;

            canvasCtx.fillStyle = `hsl(${(i / NUM_BARS) * 240}, 100%, 70%)`;
            canvasCtx.fillRect(
                x + barWidth * 0.02, 
                canvas.height - barHeight,
                barWidth * 0.96,
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
                canvasCtx.font = "24px Arial";
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
            canvasCtx.fillStyle = "red";
            canvasCtx.fillText("Failed to initialize audio", canvas.width/2, canvas.height/2);
        }
    };

    initVisualization();
});
