#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etwtjrkjphbdkwojhozg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d3RqcmtqcGhiZGt3b2pob3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzExNjAzMSwiZXhwIjoyMTAyNjkyMDMxfQ.uZG0zFFU2InmimTIZ-HsI2ZrCpPEpINuX-E4YqrFROU'
);

const { data, error } = await supabase
  .from('app_settings')
  .select('key, value')
  .or('key.like.%survey%,key.like.%cpx%,key.like.%theorem%,key.like.%timewall%')
  .order('key');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Survey Settings in Database:');
  console.table(data);
  
  console.log('\nJSON representation:');
  data?.forEach(row => {
    console.log(`${row.key}: ${JSON.stringify(row.value)} (type: ${typeof row.value})`);
  });
}
