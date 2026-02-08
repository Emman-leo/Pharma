// Debug script to help with user profile issues
import { supabase } from './supabase.js';
import { userService } from './user-service.js';

async function debugUserProfile() {
    console.log('=== User Profile Debug ===');
    
    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
        console.error('Auth error:', authError);
        return;
    }
    
    console.log('Current auth user:', user);
    
    if (!user) {
        console.log('No authenticated user');
        return;
    }
    
    // Try to fetch profile directly
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    console.log('Profile from DB:', profile);
    console.log('Profile error:', profileError);
    
    if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile does not exist, will be created on next app load');
        
        // Try to create a basic profile manually
        const profileData = {
            id: user.id,
            email: user.email || 'unknown@user.com',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
            role: 'staff' // Default role
        };
        
        console.log('Attempting to create profile:', profileData);
        
        const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([profileData]);
            
        if (insertError) {
            console.error('Error creating profile:', insertError);
        } else {
            console.log('Profile created successfully');
        }
    }
    
    console.log('========================');
}

// Run the debug function
debugUserProfile();