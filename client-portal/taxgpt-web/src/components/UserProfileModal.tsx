import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

type UserType = 'business' | 'individual' | null;
type EmployeeCount = '1-10' | '11-50' | '51-250' | '251+' | null;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userType: UserType, employeeCount: EmployeeCount) => void;
  initialUserType?: UserType;
  initialEmployeeCount?: EmployeeCount;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onSave,
  initialUserType,
  initialEmployeeCount,
}: UserProfileModalProps) {
  const { user } = useUser();
  const [userType, setUserType] = useState<UserType>(initialUserType || null);
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount>(initialEmployeeCount || null);

  useEffect(() => {
    if (isOpen) {
      setUserType(initialUserType || null);
      setEmployeeCount(initialEmployeeCount || null);
    }
  }, [isOpen, initialUserType, initialEmployeeCount]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!userType) {
      alert('Please select what best describes you');
      return;
    }
    if (userType === 'business' && !employeeCount) {
      alert('Please select how many employees you have');
      return;
    }
    onSave(userType, employeeCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Profile for</p>
            <p className="font-medium text-gray-900">{user?.fullName || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>

          {/* Question 1: What best describes you? */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What best describes you? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setUserType('business');
                  if (userType !== 'business') {
                    setEmployeeCount(null); // Reset employee count when switching
                  }
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  userType === 'business'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Business</div>
                <div className="text-sm text-gray-600">Internal Finance or Ops Teams</div>
              </button>
              <button
                onClick={() => {
                  setUserType('individual');
                  setEmployeeCount(null); // Clear employee count for individuals
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  userType === 'individual'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Individual</div>
                <div className="text-sm text-gray-600">Self-filers or Gig workers</div>
              </button>
            </div>
          </div>

          {/* Question 2: How many employees? (only show for businesses) */}
          {userType === 'business' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How many employees do you have? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['1-10', '11-50', '51-250', '251+'] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => setEmployeeCount(count)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      employeeCount === count
                        ? 'border-yellow-400 bg-yellow-50 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {count === '251+' ? 'More than 251 employees' : `${count} employees`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
