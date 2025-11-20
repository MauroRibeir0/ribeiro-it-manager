import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csmabbusumuxucgrrjew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWFiYnVzdW11eHVjZ3JyamV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTQ3NTQsImV4cCI6MjA3OTIzMDc1NH0.aQQD4y6HRSslCapGrgmX52nKGi5VzDqH_oSV1HbEvc8';

export const supabase = createClient(supabaseUrl, supabaseKey);