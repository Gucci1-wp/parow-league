const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        console.log('✅ Login successful');
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user);
        process.exit(0);
    } catch (err) {
        console.error('❌ Login failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

testLogin();
