const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    // Use JWT secret from env or fallback to a default for development
    const secret = process.env.JWT_SECRET || 'dev-secret-key';
    return jwt.sign({ id }, secret, {
        expiresIn: '1d',
    });
};

module.exports = generateToken;
