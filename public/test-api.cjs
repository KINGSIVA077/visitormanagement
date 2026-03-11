const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(BASE_URL + path, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data ? (data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data) : null
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting API Verification Tests...');

    // 1. Test Auth Middleware (Unauthorized)
    console.log('\n--- Test 1: Unauthorized Access ---');
    const authTest = await testEndpoint('/visitor-requests/pending', 'GET');
    if (authTest.status === 401 || (authTest.data && authTest.data.error)) {
        console.log('✅ PASS: /api/visitor-requests/pending blocked (Status:', authTest.status, ')');
    } else {
        console.log('❌ FAIL: /api/visitor-requests/pending should be protected. Status:', authTest.status, 'Data:', authTest.data);
    }

    // 2. Test Rate Limiting
    console.log('\n--- Test 2: Rate Limiting ---');
    console.log('Sending fast requests...');
    let limited = false;
    for (let i = 0; i < 20; i++) {
        const res = await testEndpoint('/server-info');
        if (res.status === 429) {
            limited = true;
            break;
        }
    }
    if (limited) console.log('✅ PASS: Rate limiting caught rapid requests (Status 429)');
    else console.log('⚠️ INFO: Rate limit not triggered in 20 requests (might be higher)');

    // 3. Test Visitor History Endpoint
    console.log('\n--- Test 3: Visitor History ---');
    const histTest = await testEndpoint('/visitor-requests/history/stf-user-222');
    if (Array.isArray(histTest.data)) {
        console.log('✅ PASS: History endpoint returned array of records');
    } else {
        console.log('❌ FAIL: History endpoint failed');
    }

    // 4. Test CORS
    console.log('\n--- Test 4: CORS Header ---');
    const corsTest = await testEndpoint('/server-info');
    if (corsTest.headers['access-control-allow-origin']) {
        console.log('✅ PASS: CORS headers present');
    }

    console.log('\n✨ Tests completed.');
}

runTests().catch(console.error);
