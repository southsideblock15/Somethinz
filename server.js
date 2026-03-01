// server.js
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_FILE = './body.txt';

app.use(express.json());
app.use(express.text());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// POST /body: save script
app.post('/body', (req, res) => {
    const script = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);
    try {
        fs.writeFileSync(BODY_FILE, script, 'utf8');
        console.log('body.txt updated with new script');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /receive: return latest script
app.get('/receive', (req, res) => {
    if (!fs.existsSync(BODY_FILE)) return res.send("");
    try {
        const script = fs.readFileSync(BODY_FILE, 'utf8');
        res.type('text/plain').send(script);
    } catch {
        res.send("");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));