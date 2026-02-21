import { createFileRoute, redirect } from '@tanstack/react-router';
import { tokenStore } from '@/lib/request';
import { useUserStore } from '@/store/user';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: () => {
    const token = tokenStore.get();
    const user = useUserStore.getState();

    // If no token or no user info in store, redirect to login
    if (!token || !user.id) {
      // Clear potentially stale user state
      user.clearUser();
      throw redirect({
        to: '/login',
        search: {
          // Redirect back to the original page after login
          redirect: location.href,
        },
      });
    }

    // If user is not an admin, redirect to home
    if (user.realm !== 'ADMIN') {
      throw redirect({ to: '/' });
    }
  },
});
