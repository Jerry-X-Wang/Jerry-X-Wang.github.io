// 创建音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 获取全屏canvas元素
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

// 设置全屏尺寸
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 对数参数配置
const LOG_BASE = 20;
const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const NUM_BARS = 16;

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    
    let mediaStream;

    // 启动可视化
    const initVisualization = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(mediaStream);
            const analyser = audioContext.createAnalyser();

            source.connect(analyser);
            analyser.fftSize = 2 ** 12;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // 预计算对数映射表
            const logMap = [];
            const sampleRate = audioContext.sampleRate;
            
            // 生成频率映射表
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

            // 绘制函数
            const draw = () => {
                requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                // 背景
                canvasCtx.fillStyle = 'rgb(0, 0, 0)';
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

                const totalLogWidth = Math.log10(MAX_FREQ/MIN_FREQ);
                let x = 0;

                // 可视化渲染
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

                        canvasCtx.fillStyle = `hsl(${(i / NUM_BARS) * 240}, 100%, 70%)`;
                        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth * 0.98, barHeight);
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

    // 启动可视化流程
    initVisualization();
});
