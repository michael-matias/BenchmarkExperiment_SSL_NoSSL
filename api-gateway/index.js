const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;
const SECRET = 'your-secret';

const USE_HTTPS_FOR_SERVICES = process.env.USE_HTTPS_FOR_SERVICES === 'true';

const serviceUrls = {
    service1: USE_HTTPS_FOR_SERVICES ? 'https://service1:8443' : 'http://service1:8080',
    service2: USE_HTTPS_FOR_SERVICES ? 'https://service2:8443' : 'http://service2:8080',
    service3: USE_HTTPS_FOR_SERVICES ? 'https://service3:8443' : 'http://service3:8080'
};

Object.entries(serviceUrls).forEach(([key, value]) => {
    console.log(`${key.toUpperCase()} URL: ${value}`);
});

const axiosInstance = axios.create({
    httpsAgent: USE_HTTPS_FOR_SERVICES ? new https.Agent({ rejectUnauthorized: false }) : undefined
});

app.use(express.json({ limit: '50mb' }));

const getToken = (req) => req.headers.authorization.split(" ")[1];

const scenarios = {
    scenarioA: (service, req) => ({
        url: serviceUrls[service] + `/${service}`,
        data: {
            jwtData: jwt.verify(getToken(req), SECRET),
            payloadData: req.body.payloadData
        }
    }),
    scenarioB: (service, req) => ({
        url: serviceUrls[service] + `/${service}`,
        data: {
            jwtToken: getToken(req),
            payloadData: req.body.payloadData
        }
    }),
    scenarioC: (service, req) => {
        jwt.verify(getToken(req), SECRET);
        return {
            url: serviceUrls[service] + `/${service}`,
            data: {
                jwtToken: getToken(req),
                payloadData: req.body.payloadData
            }
        };
    }
};

['service1', 'service2', 'service3'].forEach(service => {
    app.get(`/gateway/${service}`, async (req, res) => {
        try {
            const response = await axiosInstance.get(serviceUrls[service] + `/${service}`);
            res.send(response.data);
        } catch (error) {
            console.error(`Error fetching from ${service.toUpperCase()}:`, error.message);
            res.status(500).send(`Failed to fetch from ${service.toUpperCase()}`);
        }
    });

    Object.keys(scenarios).forEach(scenario => {
        app.post(`/gateway/${scenario}/${service}`, async (req, res) => {
            try {
                const { url, data } = scenarios[scenario](service, req);
                const response = await axiosInstance.post(url, data);
                res.send(response.data);
            } catch (error) {
                console.error(`Error in ${scenario} for ${service}:`, error.message);
                res.status(500).send(`Failed in ${scenario} for ${service}`);
            }
        });
    });
});

app.get('', (req, res) => {
    res.send('Hello Gateway');
});

const httpsServer = https.createServer({
    key: fs.readFileSync('/certs/domain.key'),
    cert: fs.readFileSync('/certs/domain.crt')
}, app);

httpsServer.listen(PORT, () => {
    console.log(`API Gateway started on https://localhost:${PORT}`);
});
