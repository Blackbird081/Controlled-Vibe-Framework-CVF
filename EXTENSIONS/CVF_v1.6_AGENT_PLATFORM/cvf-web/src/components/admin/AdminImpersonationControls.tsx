'use client';

import { useState, useTransition } from 'react';

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
};

export function AdminImpersonationControls({ users }: { users: UserOption[] }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startImpersonation = () => {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch('/api/admin/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUserId }),
          credentials: 'include',
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to start impersonation.');
        }

        window.location.href = '/home';
      } catch (startError) {
        setError(startError instanceof Error ? startError.message : 'Failed to start impersonation.');
      }
    });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        <div className="text-sm text-gray-500">Owner only</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">View as user</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Starts a one-hour impersonation session. Admin console access will drop to the impersonated user role until the session ends.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">Select user</span>
          <select
            value={selectedUserId}
            onChange={event => setSelectedUserId(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role} • {user.teamId})
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={startImpersonation}
        disabled={isPending || !selectedUserId}
        className="mt-4 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Starting...' : 'Start Impersonation'}
      </button>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}
    </section>
  );
}
