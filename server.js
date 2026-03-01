const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_FILE = path.join(__dirname, 'body.txt');

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// POST /body → save JSON command
app.post('/body', (req, res) => {
    const body = JSON.stringify(req.body, null, 2);
    try {
        fs.writeFileSync(BODY_FILE, body, 'utf8');
        console.log('body.txt updated with new command:', body);
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing body.txt:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /receive → return latest command
app.get('/receive', (req, res) => {
    if (!fs.existsSync(BODY_FILE)) return res.json({});

    const content = fs.readFileSync(BODY_FILE, 'utf8');
    try {
        const json = JSON.parse(content);
        res.json(json);  // send proper JSON to Roblox
    } catch (err) {
        console.error('Invalid JSON in body.txt:', err);
        res.json({});
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});