
const SUPABASE_URL = 'https://iqfhaymgvhlnwvkfyjjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5nzRVGO6FDHLvXMdc2OCgA_lA03cXPg';

async function checkColumn() {
    console.log('Checking if external_id column exists in catalog_games...');
    // Try to select external_id from catalog_games
    // We expect an empty list (200 OK) if column exists, or 400 Bad Request ("column does not exist") if it fails.

    const response = await fetch(`${SUPABASE_URL}/rest/v1/catalog_games?select=external_id&limit=1`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    console.log('Status:', response.status);
    if (response.ok) {
        console.log('RESULT: COLUMN EXISTS (SQL ran effectively)');
    } else {
        const text = await response.text();
        console.log('RESULT: COLUMN MISSING (SQL did not run)');
        console.log('Error:', text);
    }
}

checkColumn();
