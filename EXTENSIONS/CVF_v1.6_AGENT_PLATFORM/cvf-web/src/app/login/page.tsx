import LoginPageClient from './LoginPageClient';
import { isOAuthProviderId } from '@/lib/oauth-identity-profile';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const localMockAllowed = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  const selectedOAuthProvider = isOAuthProviderId(process.env.CVF_OAUTH_PROVIDER)
    ? process.env.CVF_OAUTH_PROVIDER
    : null;

  return <LoginPageClient localMockAllowed={localMockAllowed} selectedOAuthProvider={selectedOAuthProvider} />;
}
