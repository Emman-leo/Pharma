import { supabase } from './supabase.js';

class UserService {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
    }

    // Initialize user service and load current user data
    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUser = user;
            await this.loadUserProfile();
            await this.updateLastLogin();
        }
        return this.currentUser;
    }

    // Load user profile from database
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
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
                    console.error('Error loading user profile:', error);
                    return null;
                }
            }

            if (data) {
                this.userProfile = data;
            }

            return this.userProfile;
        } catch (error) {
            console.error('Error in loadUserProfile:', error);
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
                console.error('Error creating profile:', error);
                // The profile might already exist due to manual creation, try to fetch it
                const { data: existingData, error: fetchError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', profileData.id)
                    .single();
                    
                if (fetchError) {
                    console.error('Error fetching existing profile:', fetchError);
                    return null;
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
                console.error('Error fetching created profile:', fetchError);
                return null;
            }
            
            this.userProfile = createdData;
            return createdData;
        } catch (error) {
            console.error('Error in createProfile:', error);
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
        if (!this.currentUser || !this.userProfile) return;

        try {
            const activityData = {
                user_id: this.currentUser.id,
                user_name: this.userProfile.full_name,
                action: action,
                details: details
            };

            await supabase
                .from('activity_log')
                .insert([activityData]);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Check if user has admin role
    isAdmin() {
        return this.userProfile && this.userProfile.role === 'admin';
    }

    // Check if user has staff role
    isStaff() {
        return this.userProfile && this.userProfile.role === 'staff';
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