const UIElements = {
    startBtn: document.getElementById('startBtn'),
    pingResult: document.getElementById('pingResult'),
    downloadResult: document.getElementById('downloadResult'),
    uploadResult: document.getElementById('uploadResult'),
    speedDisplay: document.getElementById('speedDisplay'),
    gaugeCenter: document.getElementById('gaugeCenter'),
    gaugeProgress: document.querySelector('.gauge-progress'),
};

const testConfig = {
    fileSize: 200 * 1024 * 1024, // 200 MB
    maxSpeedForGauge: 1000, // Max speed in Mbps for the gauge
};

// Hide Rerun button initially
UIElements.startBtn.style.display = 'none';

function updateGauge(speed) {
    const percentage = (speed / testConfig.maxSpeedForGauge) * 100;
    UIElements.gaugeProgress.style.setProperty('--progress-percent', `${Math.min(percentage, 100)}%`);
    UIElements.speedDisplay.querySelector('.speed-value').textContent = speed.toFixed(2);
}

function showUIState(state) {
    if (state === 'testing') {
        UIElements.startBtn.style.display = 'none';
        UIElements.speedDisplay.style.display = 'block';
    } else {
        UIElements.startBtn.style.display = 'block';
        UIElements.speedDisplay.style.display = 'none';
    }
}

UIElements.startBtn.addEventListener('click', async () => {
    showUIState('testing');

    ['pingResult', 'downloadResult', 'uploadResult'].forEach(id => UIElements[id].textContent = '-');
    updateGauge(0);
    
    await runPingTest();
    
    const finalDownloadSpeed = await runDownloadTest();
    UIElements.downloadResult.textContent = finalDownloadSpeed.toFixed(2);
    
    const finalUploadSpeed = await runUploadTest();
    UIElements.uploadResult.textContent = finalUploadSpeed.toFixed(2);
    
    showUIState('finished');
});

// Automatically trigger test on load
document.addEventListener('DOMContentLoaded', () => UIElements.startBtn.click());

// --- Test Functions ---

async function runPingTest() {
    UIElements.pingResult.textContent = '...';
    const startTime = performance.now();
    try {
        await fetch(`/ping?t=${new Date().getTime()}`, { cache: 'no-store' });
        UIElements.pingResult.textContent = `${Math.round(performance.now() - startTime)}`;
    } catch (e) {
        UIElements.pingResult.textContent = 'Error';
    }
}

async function runDownloadTest() {
    let receivedLength = 0;
    let startTime = performance.now();
    try {
        const response = await fetch(`/test-files/random.dat?t=${new Date().getTime()}`, { cache: 'no-store' });
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedLength += value.length;
            const speed = (receivedLength * 8) / ((performance.now() - startTime) / 1000) / 1_000_000;
            updateGauge(speed);
        }
        // ✅ Corrected: Use actual received length instead of fixed config
        return (receivedLength * 8) / ((performance.now() - startTime) / 1000) / 1_000_000;
    } catch (e) {
        return 0;
    }
}

function runUploadTest() {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/upload?t=${new Date().getTime()}`, true);
        const startTime = performance.now();
        xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
                const speed = (e.loaded * 8) / ((performance.now() - startTime) / 1000) / 1_000_000;
                updateGauge(speed);
            }
        };
        xhr.onload = () => {
            resolve((testConfig.fileSize * 8) / ((performance.now() - startTime) / 1000) / 1_000_000);
        };
        xhr.onerror = () => resolve(0);
        xhr.send(new Blob([new ArrayBuffer(testConfig.fileSize)], { type: 'application/octet-stream' }));
    });
}
