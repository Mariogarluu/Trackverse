
const { createClient } = require('@supabase/supabase-js');
const { environment } = require('./src/environments/environment');

// Polyfill for environment import if it fails in node (simpler to hardcode for this check based on previous view_file or use .env)
// Actually I see values in .env from previous turns.
const SUPABASE_URL = 'https://iqfhaymgvhlnwvkfyjjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5nzRVGO6FDHLvXMdc2OCgA_lA03cXPg'; // From environment.ts view

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRpc() {
    console.log('Checking RPC track_new_item...');
    const { data, error } = await supabase.rpc('track_new_item', {});

    if (error) {
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('HTTP Status:', error.status); // 404 if missing, 400/500 if exists but params missing

        if (error.code === 'PGRST202' || error.message.includes('Could not find the function') || error.status === 404) {
            console.log('RESULT: MISSING');
        } else {
            console.log('RESULT: EXISTS (Failed with other error, which is expected for empty params)');
        }
    } else {
        console.log('RESULT: EXISTS');
    }
}

checkRpc();
