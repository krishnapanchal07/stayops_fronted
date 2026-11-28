import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { Link } from 'react-router-dom';

export function SecurityDashboardPage() {
  const user = useCurrentUser();
  return <div><PageHeader title="Security Dashboard" />
    <Card><p className="typo-subtitle">{user?.name}</p>
      <Link className="mt-3 inline-block text-primary" to={PATHS.security.profile}>View your staff profile</Link>
    </Card>
  </div>;
}
