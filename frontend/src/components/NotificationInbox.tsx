import { Inbox } from '@novu/react';
import { useSessionStore } from '../store/session';

function NotificationInbox() {
  const user = useSessionStore((state) => state.user);
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER || 'EruMy_dBPbUT';

  if (!applicationIdentifier) {
    console.error('NOVU_APPLICATION_IDENTIFIER is not defined');
    return null;
  }

  // Extract subscriber ID from the authenticated user, or use fallback
  const subscriberId = user?.id ? String(user.id) : '6a004dce38dc4a625bdf1131';

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      appearance={{
        variables: {
          colorPrimary: '#059669', // emerald-600
          colorPrimaryForeground: '#ffffff',
          colorSecondary: '#f1f5f9', // slate-100
          colorSecondaryForeground: '#0f172a', // slate-900
          colorBackground: '#ffffff',
          colorForeground: '#0f172a',
          colorNeutral: '#e2e8f0', // slate-200
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: '#334155', // slate-700
          },
        },
      }}
    />
  );
}

export default NotificationInbox;
