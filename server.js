const express = require('express');
const fs = require('fs');

const app = express();

// --- CONFIG ---
const PORT = process.env.PORT || 3000;
const BREACH_MESSAGE = 'breached by Wireshark authorities';
const BODY_FILE = './body.txt';
const MESSAGE_FILE = './messages.json'; // optional, can use later if needed

// --- GLOBAL LOGGER ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    next();
});

// --- BODY PARSING ---
app.use(express.json());
app.use(express.text());

// --- DEFAULT ROUTE ---
app.get('/', (req, res) => {
    console.log(`Root GET from ${req.socket.remoteAddress}`);
    res.type('text/plain').send(BREACH_MESSAGE);
});

// --- POST /body: Save script to body.txt immediately ---
app.post('/body', (req, res) => {
    console.log("POST /body received:", req.body);

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);

    // Reject breach message
    if (body.includes(BREACH_MESSAGE) || body.trim() === BREACH_MESSAGE) {
        console.log('Rejected breach message in /body');
        return res.status(400).json({ success: false, error: 'Forbidden content' });
    }

    try {
        // Overwrite body.txt immediately
        fs.writeFileSync(BODY_FILE, body, 'utf8');
        console.log(`body.txt updated with new content`);
        res.json({ success: true, message: 'body.txt updated successfully' });
    } catch (err) {
        console.error('Error writing body.txt:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- GET /receive: Return the latest body.txt (Lua script) ---
app.get('/receive', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const robloxId = req.headers['roblox-id'] || '';

    console.log(`GET /receive from user-agent: ${userAgent}, roblox-id: ${robloxId}`);

    // Block browsers or missing Roblox-ID
    if (userAgent.includes('Mozilla')) {
        return res.status(403).send("Browser access forbidden");
    }
    if (!robloxId) {
        return res.status(400).send("Missing roblox-id header");
    }

    if (!fs.existsSync(BODY_FILE)) {
        return res.type('text/plain').send("");
    }

    try {
        const scriptData = fs.readFileSync(BODY_FILE, 'utf8');

        // Reject breach message in file
        if (scriptData.includes(BREACH_MESSAGE)) {
            console.log('Breach message detected in body.txt, returning empty');
            return res.type('text/plain').send("");
        }

        res.type('text/plain').send(scriptData);
    } catch (err) {
        console.error('Error reading body.txt:', err);
        res.type('text/plain').send("");
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}/`);
});