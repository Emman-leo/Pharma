// Run this in your browser's console after logging in
// This will manually create a profile for your current user

async function createProfileManually() {
    // Import the necessary modules
    const { supabase } = await import('./supabase.js');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        console.log('No authenticated user found');
        return;
    }
    
    console.log('Current user:', user);
    
    // Create profile data
    const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        role: 'admin', // Change to 'staff' if you want staff access
        last_login: new Date().toISOString()
    };
    
    console.log('Creating profile:', profileData);
    
    // Try to insert the profile
    const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();
    
    if (error) {
        console.log('Insert error:', error);
        
        // If insert fails, try to update existing
        const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update({
                email: profileData.email,
                full_name: profileData.full_name,
                role: profileData.role,
                last_login: profileData.last_login
            })
            .eq('id', user.id)
            .select()
            .single();
            
        if (updateError) {
            console.log('Update error:', updateError);
            return null;
        }
        
        console.log('Profile updated:', updateData);
        return updateData;
    }
    
    console.log('Profile created:', data);
    return data;
}

// Run the function
createProfileManually().then(result => {
    console.log('Profile creation result:', result);
    if (result) {
        console.log('Profile created successfully! Refresh the page to see changes.');
    }
});