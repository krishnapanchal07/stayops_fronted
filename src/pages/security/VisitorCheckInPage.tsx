import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { VisitorStatusBadge } from '@/components/visitors/VisitorStatusBadge';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { visitorService } from '@/services/visitor/visitorService';
import type { Visitor } from '@/types/visitor';
import { formatShortDate, formatTime } from '@/utils/format';
import { ScanLine } from 'lucide-react';
import { useState } from 'react';

export function VisitorCheckInPage() {
  const toast = useToast();
  const user = useCurrentUser();
  const [code, setCode] = useState('');
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const propertyIds = user?.propertyIds;

  const verify = async () => {
    setError('');
    setVisitor(null);
    setVerifying(true);
    try {
      const found = await visitorService.verifyVisitorPass(code, propertyIds);
      setVisitor(found);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid or expired visitor pass.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Visitor Check-in"
        description="Enter a visitor code or QR token to verify the pass, then confirm check-in."
        breadcrumbs={[{ label: 'Home', href: PATHS.security.dashboard }, { label: 'Visitor Check-in' }]}
      />

      <div className="mx-auto grid max-w-3xl gap-5">
        <Card>
          <CardHeader title="Scan / Enter Pass Code" />
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 px-4 py-8 text-center">
            <ScanLine className="h-12 w-12 text-primary" />
            <p className="text-sm text-muted">Camera scanning is not enabled in Phase 2. Enter the visitor code or QR token.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <TextInput
              label="Visitor QR token / visitor code"
              name="passCode"
              value={code}
              error={error}
              placeholder="VR-1024 or VIS-1024-ABC123"
              onChange={(event) => setCode(event.target.value)}
            />
            <Button disabled={verifying || !code.trim()} onClick={() => void verify()}>
              Verify Pass
            </Button>
          </div>
        </Card>

        {visitor ? (
          <Card>
            <CardHeader title="Visitor information" action={<VisitorStatusBadge status={visitor.status} visitor={visitor} />} />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="typo-muted">Visitor</dt>
                <dd className="mt-1 font-medium">{visitor.visitorName}</dd>
              </div>
              <div>
                <dt className="typo-muted">Host</dt>
                <dd className="mt-1 font-medium">{visitor.tenantName}</dd>
              </div>
              <div>
                <dt className="typo-muted">Room</dt>
                <dd className="mt-1 font-medium">{visitor.roomNumber}</dd>
              </div>
              <div>
                <dt className="typo-muted">Visit</dt>
                <dd className="mt-1 font-medium">
                  {formatShortDate(visitor.visitDate)} · {formatTime(visitor.expectedEntryTime)}
                </dd>
              </div>
            </dl>
            <Button
              className="mt-5"
              fullWidth
              disabled={saving || !user}
              onClick={async () => {
                if (!user) return;
                setSaving(true);
                try {
                  await visitorService.checkInVisitor(visitor.id, { id: user.id, name: user.name, role: user.role }, propertyIds);
                  toast('success', 'CHECK-IN SUCCESS', `${visitor.visitorName} is now inside.`);
                  setVisitor(null);
                  setCode('');
                } catch (cause) {
                  toast('error', 'Check-in blocked', cause instanceof Error ? cause.message : 'Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Confirm Check-in
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
