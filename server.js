const express = require('express');
const fs = require('fs');

const app = express();

// The message that will be sent back to every client and also logged to the console
const BREACH_MESSAGE = 'breached by Wireshark authorities';
const MESSAGE_FILE = './messages.json';
const BODY_FILE = './body.txt';

const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.text());
app.use(express.raw({ type: '*/*' }));

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
            return res.json([]);
        }

        // Try to parse JSON and remove any occurrences of the breach message
        try {
            const parsed = JSON.parse(fileContent);

            const sanitize = (value) => {
                if (typeof value === 'string') {
                    return value === BREACH_MESSAGE ? null : value;
                }
                if (Array.isArray(value)) {
                    return value
                        .map(sanitize)
                        .filter((v) => v !== null && v !== undefined);
                }
                if (value && typeof value === 'object') {
                    const out = {};
                    Object.keys(value).forEach((k) => {
                        const v = sanitize(value[k]);
                        if (v !== null && v !== undefined) out[k] = v;
                    });
                    return out;
                }
                return value;
            };

            const safe = sanitize(parsed);
            return res.type('application/json').send(JSON.stringify(safe));
        } catch (e) {
            // Not JSON — treat as text. If it exactly matches the breach message, don't return it.
            const text = fileContent.toString();
            if (text.trim() === BREACH_MESSAGE) {
                return res.json([]);
            }

            // Otherwise, remove any plain occurrences of the breach message
            const cleaned = text.split(BREACH_MESSAGE).join('');
            return res.type('application/json').send(cleaned);
        }
    } catch (err) {
        res.json([]);
    }
});

// POST endpoint to write body to a file
app.post('/body', (req, res) => {
    try {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);
        fs.writeFileSync(BODY_FILE, body, 'utf8');
        console.log(`Body written to ${BODY_FILE}`);
        res.json({ success: true, message: 'Body written to file' });
    } catch (err) {
        console.error('Error writing body to file:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});
