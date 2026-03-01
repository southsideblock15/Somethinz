const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_FILE = './body.txt';

app.use(express.json());

// Log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// POST /body → save JSON command
app.post('/body', (req, res) => {
    const body = JSON.stringify(req.body, null, 2);
    try {
        fs.writeFileSync(BODY_FILE, body, 'utf8');
        console.log('body.txt updated with new command');
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing body.txt:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /receive → return latest command
app.get('/receive', (req, res) => {
    if (!fs.existsSync(BODY_FILE)) return res.type('text/plain').send('');
    const content = fs.readFileSync(BODY_FILE, 'utf8');
    res.type('text/plain').send(content);
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});