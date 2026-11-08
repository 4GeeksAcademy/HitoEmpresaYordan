'use client';

import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/protected-layout';
import { useAuth } from '@/hooks/useAuth';
import ProfileView from '@/components/profile-view';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your profile and account information</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 gap-8">
            <nav className="bg-white rounded-lg shadow-md p-4 border-b-4 border-blue-600">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Dashboard
              </a>
            </nav>

            <ProfileView />
          </div>
        </div>
      </main>
    </ProtectedLayout>
  );
}
