const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post(
            'http://localhost:3000/api/auth/callback/credentials',
            new URLSearchParams({
                email: 'inahi697@gmail.com',
                password: 'password123',
                redirect: 'false'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                validateStatus: null // Don't throw on error status codes
            }
        );
        console.log('Status:', res.status);
        console.log('Headers:', res.headers);
        console.log('Body:', res.data);
    } catch (e) {
        console.error(e);
    }
}

testLogin();
