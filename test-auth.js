// Test authentication flow
const backendUrl = 'http://localhost:3000';

async function testAuth() {
  console.log('\n=== Testing Authentication Flow ===\n');

  // Test 1: Login with correct credentials
  console.log('Test 1: Login with correct credentials');
  try {
    const res = await fetch(`${backendUrl}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@visitorgate.com',
        password: 'AdminPassword123!'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.ok && data.user) {
      console.log('✓ Login successful\n');
    } else {
      console.log('✗ Login failed\n');
    }
  } catch (e) {
    console.error('✗ Error:', e.message, '\n');
  }

  // Test 2: Login with wrong password
  console.log('Test 2: Login with wrong password');
  try {
    const res = await fetch(`${backendUrl}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@visitorgate.com',
        password: 'wrongpassword'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.status === 401) {
      console.log('✓ Correctly rejected wrong password\n');
    } else {
      console.log('✗ Should have returned 401\n');
    }
  } catch (e) {
    console.error('✗ Error:', e.message, '\n');
  }

  // Test 3: Check database for profiles
  console.log('Test 3: Check database profiles');
  try {
    const res = await fetch(`${backendUrl}/rest/v1/profiles`);
    const data = await res.json();
    console.log(`Total profiles: ${data.length}`);
    data.forEach(p => {
      console.log(`  - ${p.email} (id: ${p.id})`);
    });
    console.log('');
  } catch (e) {
    console.error('✗ Error:', e.message, '\n');
  }
}

testAuth().then(() => {
  console.log('=== Tests Complete ===\n');
  process.exit(0);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
