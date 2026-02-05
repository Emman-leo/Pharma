import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://amycguhqggaqjpztumva.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteWNndWhxZ2dhcWpwenR1bXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY0MTUsImV4cCI6MjA4NTg4MjQxNX0.wulTRQ4StFNBlc3SEqHmsh7nwKZ1Z4nm0c81vFd17XY'

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
