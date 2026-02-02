import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatInterface from '../components/ChatInterface';
import DisclaimerBanner from '../components/DisclaimerBanner';
import UserProfileModal from '../components/UserProfileModal';

type UserType = 'business' | 'individual' | null;
type EmployeeCount = '1-10' | '11-50' | '51-250' | '251+' | null;

export default function ChatPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith('/portal');
  const rootClassName = isPortalRoute ? 'flex flex-col h-full min-h-0' : 'flex flex-col h-screen';
  const contentClassName = isPortalRoute
    ? 'flex-1 overflow-hidden relative min-h-0'
    : 'flex-1 overflow-hidden relative';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount>(null);

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/sign-in' });
  };

  // Load user profile data from API or localStorage
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      // Try to load from API first (database)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/user/profile`, {
          withCredentials: true, // Include cookies for Clerk auth
        });
        
        if (response.data.userType) {
          setUserType(response.data.userType);
          setEmployeeCount(response.data.employeeCount || null);
          
          // Also cache in localStorage
          const localProfileKey = `user_profile_${user.id}`;
          localStorage.setItem(localProfileKey, JSON.stringify({
            userType: response.data.userType,
            employeeCount: response.data.employeeCount,
          }));
        }
      } catch (apiError: any) {
        console.warn('Failed to load profile from API, trying localStorage:', apiError);
        
        // Fallback to localStorage if API fails
        const localProfileKey = `user_profile_${user.id}`;
        const localProfile = localStorage.getItem(localProfileKey);
        
        if (localProfile) {
          try {
            const { userType: localUserType, employeeCount: localEmployeeCount } = JSON.parse(localProfile);
            setUserType(localUserType);
            setEmployeeCount(localEmployeeCount);
          } catch (err) {
            console.error('Failed to parse local profile:', err);
          }
        }
      };
      
      loadProfile();
      
      // Check if this is a new OAuth sign-up (user just completed OAuth flow)
      const oauthSignUpInProgress = sessionStorage.getItem('oauthSignUpInProgress');
      
      // Check if profile data was saved during email sign-up
      const pendingProfileData = sessionStorage.getItem('pendingProfileData');
      if (pendingProfileData) {
        const savePendingProfile = async () => {
          try {
            const { userType: pendingUserType, employeeCount: pendingEmployeeCount } = JSON.parse(pendingProfileData);
            
            // Save to database via API
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
              await axios.put(
                `${apiUrl}/api/user/profile`,
                {
                  userType: pendingUserType,
                  employeeCount: pendingEmployeeCount,
                },
                {
                  withCredentials: true,
                }
              );
            } catch (apiError) {
              console.warn('Failed to save pending profile to API:', apiError);
              // Continue anyway - will try again when user opens profile modal
            }
            
            // Also cache in localStorage
            const localProfileKey = `user_profile_${user.id}`;
            localStorage.setItem(localProfileKey, JSON.stringify({
              userType: pendingUserType,
              employeeCount: pendingEmployeeCount,
            }));
            
            sessionStorage.removeItem('pendingProfileData');
            setUserType(pendingUserType);
            setEmployeeCount(pendingEmployeeCount);
          } catch (err) {
            console.error('Failed to parse pending profile data:', err);
            sessionStorage.removeItem('pendingProfileData');
          }
        };
        
        savePendingProfile();
      }
      
      // Check if we have profile data (from API or localStorage)
      const localProfileKey = `user_profile_${user.id}`;
      const localProfile = localStorage.getItem(localProfileKey);
      const hasProfileData = !!localProfile || !!userType;
      
      // Show profile modal if profile is incomplete
      // This handles both new OAuth users and existing users without profile data
      if (!hasProfileData) {
        // Clear the OAuth flag
        if (oauthSignUpInProgress) {
          sessionStorage.removeItem('oauthSignUpInProgress');
        }
        // Small delay to ensure the page is fully loaded
        setTimeout(() => {
          setShowProfileModal(true);
        }, 500);
      } else if (oauthSignUpInProgress) {
        // User has profile data, clear the flag
        sessionStorage.removeItem('oauthSignUpInProgress');
      }
    }
  }, [user]);

  const handleSaveProfile = async (newUserType: UserType, newEmployeeCount: EmployeeCount) => {
    if (!user) return;

    try {
      // Save to database via API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(
        `${apiUrl}/api/user/profile`,
        {
          userType: newUserType,
          employeeCount: newEmployeeCount,
        },
        {
          withCredentials: true, // Include cookies for Clerk auth
        }
      );

      // Also save to localStorage as a backup/cache
      const localProfileKey = `user_profile_${user.id}`;
      localStorage.setItem(localProfileKey, JSON.stringify({
        userType: newUserType,
        employeeCount: newEmployeeCount,
      }));

      // Update local state
      setUserType(newUserType);
      setEmployeeCount(newEmployeeCount);
      setShowProfileModal(false);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className={rootClassName}>
      <div className={contentClassName}>
        {/* User Menu Button */}
        {!isPortalRoute && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.emailAddresses?.[0]?.emailAddress}
                      </p>
                      {userType && (
                        <p className="text-xs text-gray-500 mt-1">
                          {userType === 'business' 
                            ? `Business • ${employeeCount || 'Not specified'} employees`
                            : 'Individual'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <ChatInterface userId={user?.id || ''} />
      </div>
      <DisclaimerBanner />
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        initialUserType={userType}
        initialEmployeeCount={employeeCount}
      />
    </div>
  );
}

