const express = require('express');
const fs = require('fs');

const app = express();

// The message that will be sent back to every client and also logged to the console
const BREACH_MESSAGE = 'breached by Wireshark authorities';
const MESSAGE_FILE = './messages.json';

const port = process.env.PORT || 3000;

// Default route
app.get('/', (req, res) => {
  console.log(`Received request from ${req.socket.remoteAddress}`);
  console.log(`Responding with breach notice: ${BREACH_MESSAGE}`);

  res.type('text/plain').send(BREACH_MESSAGE);
});

// Receive endpoint
app.get('/receive.php', async (req, res) => {
    const userAgent = req.headers['user-agent'];
    if (userAgent.includes('Mozilla')) {
        return;
    }

    const id = req.headers['roblox-id'];
    if (!id) { return }

    const customHeaderKey = '[?!]';
    const customHeader = req.headers[customHeaderKey];

    if (!customHeader || customHeader !== '[?!]') {
        return;
    }

    res.type('application/json');

    if (!fs.existsSync(MESSAGE_FILE)) {
        return res.json([]);
    }

    try {
        const fileContent = fs.readFileSync(MESSAGE_FILE, 'utf8');
        if (!fileContent) {
            return res.json("?");
        } else {
            return res.type("application/json").send(fileContent);
        }
    } catch (err) {
        res.json([]);
    }
});

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});
