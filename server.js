const express = require('express');
const path = require('path');
const app = express();

// The hosting service provides the port. Fallback to 8080 for local development.
const PORT = process.env.PORT || 8080;

// Serve all static files (index.html, etc.) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Ping endpoint remains the same
app.get('/ping', (req, res) => {
    res.sendStatus(200);
});

// Download endpoint now generates data in memory instead of reading a file
app.get('/test-files/random.dat', (req, res) => {
    const fileSizeInMB = 10; // Keeping the 10MB size for a ~30Mbps test
    const totalSize = fileSizeInMB * 1024 * 1024;
    const chunkSize = 1 * 1024 * 1024; // Stream in 1MB chunks
    const chunk = Buffer.alloc(chunkSize, '0'); // Create a chunk of data

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', totalSize);
    res.setHeader('Accept-Ranges', 'bytes');

    let bytesSent = 0;
    const sendChunk = () => {
        if (bytesSent < totalSize) {
            if (res.write(chunk)) {
                bytesSent += chunkSize;
                // Continue sending immediately if the buffer is not full
                if (bytesSent < totalSize) {
                    sendChunk();
                } else {
                    res.end();
                }
            } else {
                // If the buffer is full, wait for it to drain
                res.once('drain', () => {
                    bytesSent += chunkSize;
                    sendChunk();
                });
            }
        } else {
            res.end();
        }
    };
    sendChunk();
});

// Upload endpoint remains the same
app.post('/upload', (req, res) => {
    // We just consume the data stream and do nothing with it
    req.on('data', (chunk) => {});
    req.on('end', () => {
        res.status(200).send('Upload finished');
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
});