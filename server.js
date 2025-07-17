const express = require('express');
const path = require('path');
const app = express();

// Use the port provided by the hosting environment (like Render), or 3030 for local testing
const PORT = process.env.PORT || 3030;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Ping endpoint
app.get('/ping', (req, res) => {
    res.sendStatus(200);
});

// Download speed test endpoint
app.get('/test-files/random.dat', (req, res) => {
    const fileSizeInMB = 600;
    const totalSize = fileSizeInMB * 1024 * 1024;
    const chunkSize = 1 * 1024 * 1024;
    const chunk = Buffer.alloc(chunkSize, '0');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', totalSize);
    res.setHeader('Accept-Ranges', 'bytes');

    let bytesSent = 0;
    const sendChunk = () => {
        if (bytesSent < totalSize) {
            if (res.write(chunk)) {
                bytesSent += chunkSize;
                if (bytesSent < totalSize) {
                    process.nextTick(sendChunk);
                } else {
                    res.end();
                }
            } else {
                res.once('drain', sendChunk);
            }
        } else {
            res.end();
        }
    };
    sendChunk();
});

// Upload speed test endpoint
app.post('/upload', (req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
        res.status(200).send('Upload finished');
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
