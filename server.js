const http = require('http');

// The message that will be sent back to every client and also logged to the console
const BREACH_MESSAGE = 'breached by Wireshark authorities';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // log the request and the "breach" message whenever the server is hit
  console.log(`Received request from ${req.socket.remoteAddress}`);
  console.log(`Responding with breach notice: ${BREACH_MESSAGE}`);

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(BREACH_MESSAGE);
});

server.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});
