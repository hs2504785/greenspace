import { supabase } from './src/lib/supabase.js';

async function testConnection() {
  try {
    // Test connection
    const { data: test, error: testError } = await supabase
      .from('users')
      .select('count(*)')
      .single();

    if (testError) {
      console.error('Error testing connection:', testError);
      return;
    }

    console.log('Connection successful, users count:', test.count);

    // Test tables existence
    const tables = ['users', 'vegetables', 'orders', 'order_items', 'discussions', 'comments'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count(*)')
        .single();

      console.log(`Table ${table}: ${error ? 'Not found or error' : 'Exists'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection();
