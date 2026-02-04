
const SUPABASE_URL = 'https://iqfhaymgvhlnwvkfyjjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5nzRVGO6FDHLvXMdc2OCgA_lA03cXPg'; // Public Key

async function check() {
    console.log('Checking RPC...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_new_item`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body to trigger parameter error if exists
    });

    console.log('Status:', response.status);

    if (response.status === 404) {
        console.log('RESULT: MISSING (404)');
    } else {
        console.log('RESULT: EXISTS (Status ' + response.status + ')');
        const text = await response.text();
        console.log('Response:', text);
    }
}

check();
