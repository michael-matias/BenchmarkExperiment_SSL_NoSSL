const express = require('express');
const https = require('https');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT_HTTP = 8080;
const PORT_HTTPS = 8443;
const SECRET = 'your-secret';

// Middleware to handle token parsing and decoding
app.use((req, res, next) => {
    if (req.body.token) {
        try {
            const decoded = jwt.verify(req.body.token, SECRET);
            req.decodedToken = decoded;
        } catch (error) {
            return next(error);  // Pass the error to the centralized error handler
        }
    }
    next();
});

app.get('/service1', (req, res) => {
    res.send('Response from Service 1');
});

app.post('/service1', (req, res) => {
    if (req.body.jwtData) {
        res.send('OK');  // This assumes token came raw and service1 decoded it.
    } else if (req.body.jwtToken) {
        res.send('OK');  // This assumes token was decoded at the gateway.
    } else {
        res.status(500).send("Payload not expected");
    }
});

// Centralized error handling
app.use((err, req, res, next) => {
    console.error("Error in service1:", err.message);
    res.status(500).send("Failed in service1");
});

// HTTP Server
app.listen(PORT_HTTP, () => {
    console.log(`Service 1 HTTP started on port ${PORT_HTTP}`);
});

// HTTPS Options & Server
let httpsOptions;
try {
    httpsOptions = {
        key: fs.readFileSync('/certs/domain.key'),
        cert: fs.readFileSync('/certs/domain.crt')
    };
} catch (error) {
    console.error('Error loading HTTPS options for Service 1:', error.message);
    process.exit(1);  // Exit the process if there's an error loading the options
}

https.createServer(httpsOptions, app).listen(PORT_HTTPS, () => {
    console.log(`Service 1 HTTPS started on port ${PORT_HTTPS}`);
});
