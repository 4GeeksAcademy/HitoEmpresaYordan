'use client';

import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/protected-layout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex gap-4">
              <a
                href="/account/profile"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                My Profile
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold mb-4">Welcome to your Dashboard</h2>
            <p className="text-gray-600 mb-6">
              You are successfully authenticated. Your JWT is stored in localStorage, which is accessible to JavaScript and may be exposed by an XSS attack.
            </p>
            <a
              href="/account/profile"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View and Edit Your Profile
            </a>
          </div>
        </div>
      </main>
    </ProtectedLayout>
  );
}
