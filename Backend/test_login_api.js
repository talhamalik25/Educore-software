const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login...');
        const res = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@educore.test',
            password: 'password123'
        });
        console.log('Login Success!');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log('Login Failed!');
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.log('Error Message:', err.message);
        }
    }
};

testLogin();
