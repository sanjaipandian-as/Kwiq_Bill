const axios = require('axios');

const testLogin = async () => {
    try {
        const res = await axios.post('http://localhost:5000/auth/login', {
            email: 'admin@example.com',
            password: '123456'
        });
        console.log('Login Success:', res.status, res.data.user);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed:', error.response.status, error.response.data);
        } else {
            console.error('Login Error:', error.message);
        }
    }
};

testLogin();
