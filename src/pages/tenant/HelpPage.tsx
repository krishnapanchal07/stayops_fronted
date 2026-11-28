import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PATHS } from '@/routes/paths';
import { Link } from 'react-router-dom';

export function HelpPage() {
  return <div><PageHeader title="Help" />
    <Card><p>For room or property issues, submit a complaint through your tenant account.</p>
      <Link className="mt-3 inline-block text-primary" to={PATHS.tenant.complaints}>Open complaints</Link>
    </Card>
  </div>;
}
