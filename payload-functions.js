require('dotenv').config();
const jwt = require('jsonwebtoken');
const multiplier = process.env.PAYLOAD_MULTIPLIER; // 0.1 MB, 1MB, 10MB

module.exports.generateToken = (context, ee, next) => {
    const dummyData = '0'.repeat(1 * 1024);

    const payload = {
        data: dummyData
    };

    const token = jwt.sign(payload, 'your-secret');
    context.vars.token = token;
    context.vars.payload = '0'.repeat(multiplier * 1024 * 1024); 
    
    return next();
};
