import { supabase } from './supabase.js';

class UserService {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
    }

    // Initialize user service and load current user data
    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth user:', user);
        
        if (user) {
            this.currentUser = user;
            const profile = await this.loadUserProfile();
            console.log('Loaded profile:', profile);
            
            if (profile) {
                await this.updateLastLogin();
            } else {
                // If profile loading failed, try to create one directly
                console.log('Attempting to create profile directly');
                await this.createProfileDirect();
            }
        }
        
        console.log('Final user state:', this.currentUser);
        console.log('Final profile state:', this.userProfile);
        return this.currentUser;
    }

    // Load user profile from database
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            // Try to load the user profile
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows found - profile doesn't exist
                    console.log('User profile not found, creating new profile');
                    // Create profile if it doesn't exist
                    return await this.createProfile();
                } else {
                    console.warn('Error loading user profile (continuing with guest access):', error);
                    // If there's an RLS or other error, we'll return null but won't break the app
                    return null;
                }
            }

            if (data) {
                this.userProfile = data;
            }

            return this.userProfile;
        } catch (error) {
            console.warn('Error in loadUserProfile (continuing with guest access):', error);
            return null;
        }
    }

    // Create user profile
    async createProfile() {
        if (!this.currentUser) return null;

        try {
            const profileData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                full_name: this.currentUser.user_metadata?.full_name || this.currentUser.email?.split('@')[0] || 'Unknown User', // Use metadata or email for name
                role: 'staff', // Default role
                last_login: new Date().toISOString()
            };

            // Try to insert the profile
            const { data, error } = await supabase
                .from('user_profiles')
                .insert([profileData]);

            if (error) {
                console.warn('Error creating profile (attempting to fetch existing):', error);
                // The profile might already exist due to manual creation, try to fetch it
                const { data: existingData, error: fetchError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', profileData.id)
                    .single();
                    
                if (fetchError) {
                    console.warn('Could not create or fetch profile:', fetchError);
                    // As a fallback, create a temporary profile object
                    this.userProfile = {
                        id: profileData.id,
                        email: profileData.email,
                        full_name: profileData.full_name,
                        role: profileData.role,
                        last_login: profileData.last_login
                    };
                    return this.userProfile;
                }
                
                this.userProfile = existingData;
                return existingData;
            }
            
            // Fetch the created profile
            const { data: createdData, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', profileData.id)
                .single();
                
            if (fetchError) {
                console.warn('Error fetching created profile (using temp profile):', fetchError);
                // Use the profile data we tried to insert as fallback
                this.userProfile = profileData;
                return profileData;
            }
            
            this.userProfile = createdData;
            return createdData;
        } catch (error) {
            console.error('Error in createProfile:', error);
            return null;
        }
    }

    // Direct profile creation bypassing RLS issues
    async createProfileDirect() {
        if (!this.currentUser) return null;

        try {
            // Create a temporary profile in memory
            this.userProfile = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                full_name: this.currentUser.user_metadata?.full_name || this.currentUser.email?.split('@')[0] || 'Unknown User',
                role: 'staff', // Default to staff
                last_login: new Date().toISOString()
            };
            
            console.log('Created temporary profile:', this.userProfile);
            return this.userProfile;
        } catch (error) {
            console.error('Error in createProfileDirect:', error);
            return null;
        }
    }

    // Update last login timestamp
    async updateLastLogin() {
        if (!this.currentUser || !this.userProfile) return;

        try {
            await supabase
                .from('user_profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', this.currentUser.id);
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    // Log user activity
    async logActivity(action, details = null) {
        if (!this.currentUser) return;

        try {
            const activityData = {
                user_id: this.currentUser.id,
                user_name: this.userProfile?.full_name || this.currentUser.email || 'Unknown User',
                action: action,
                details: details || null
            };

            const { error } = await supabase
                .from('activity_log')
                .insert([activityData]);
                
            if (error) {
                console.error('Error logging activity:', error);
            }
        } catch (error) {
            console.error('Exception in logActivity:', error);
        }
    }

    // Check if user has admin role
    isAdmin() {
        return this.userProfile && this.userProfile.role === 'admin';
    }

    // Check if user has staff role
    isStaff() {
        // Default to staff if no profile is loaded
        return !this.userProfile || !this.userProfile.role || this.userProfile.role === 'staff';
    }

    // Get current user profile
    getProfile() {
        return this.userProfile;
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Create singleton instance
const userService = new UserService();

export { userService };