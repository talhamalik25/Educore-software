const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@educore.pk',
            password: 'SuperAdmin@123',
            role: 'superadmin'
        });
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data);
    }
};

testLogin();
