const dns = require('dns');
const { exec } = require('child_process');

console.log('--- VisitorGate Connection Diagnostic ---');

const domain = 'nbxxjqjrpzjnnfdkhhjc.supabase.co';

dns.resolve4(domain, (err, addresses) => {
    if (err) {
        console.error('DNS Resolution Error:', err);
        return;
    }

    console.log(`\n1. Current DNS Resolution for ${domain}:`);
    console.log(addresses);

    if (addresses.includes('49.44.79.236')) {
        console.log('\n[CRITICAL ISSUE DETECTED]');
        console.log('Your ISP (Reliance Jio) is redirecting Supabase to a local IP (49.44.79.236) that is NOT working.');
        console.log('This is why you see "Failed to fetch".');

        console.log('\n[HOW TO FIX PROPERLY]');
        console.log('You MUST change your DNS to Google DNS or Cloudflare DNS:');
        console.log('1. Open Network & Internet Settings -> Change adapter options');
        console.log('2. Right-click your active connection -> Properties');
        console.log('3. Select "Internet Protocol Version 4 (TCP/IPv4)" -> Properties');
        console.log('4. Use the following DNS server addresses:');
        console.log('   - Preferred DNS server: 8.8.8.8');
        console.log('   - Alternate DNS server: 8.8.4.4');
        console.log('5. Click OK and restart your browser/dev server.');
    } else {
        console.log('\n[DNS Looks OK]');
        console.log('Your DNS is returning Cloudflare IPs. If it still fails, check local firewall/VPN.');
    }
});

// Test ping to a known good IP
console.log('\nTesting direct ping to Cloudflare...');
exec('ping 104.18.38.10', (error, stdout, stderr) => {
    if (error) {
        console.log('Ping failed.');
    } else {
        console.log('Ping to Cloudflare SUCCESSFUL. This confirms a DNS change WILL fix your problem.');
    }
});
