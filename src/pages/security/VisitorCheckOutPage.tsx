import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { VisitorStatusBadge } from '@/components/visitors/VisitorStatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { visitorService } from '@/services/visitor/visitorService';
import { formatDateTime, formatTime } from '@/utils/format';
import { isVisitorOverstay } from '@/utils/visitorRules';
import { useCallback, useState } from 'react';

export function VisitorCheckOutPage() {
  const toast = useToast();
  const user = useCurrentUser();
  const propertyIds = user?.propertyIds;
  const loader = useCallback(() => visitorService.getCurrentlyInside(propertyIds), [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(loader);
  const [code, setCode] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const checkOut = async (id: string, name: string) => {
    if (!user) return;
    setSavingId(id);
    try {
      await visitorService.checkOutVisitor(id, { id: user.id, name: user.name, role: user.role }, propertyIds);
      toast('success', 'Checked out', `${name} has left the property.`);
      reload();
    } catch (cause) {
      toast('error', 'Unable to check out', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const inside = data ?? [];
  const matched = inside.filter(
    (visitor) =>
      !code.trim() ||
      visitor.visitorCode.toLowerCase().includes(code.trim().toLowerCase()) ||
      (visitor.qrToken ?? '').toLowerCase().includes(code.trim().toLowerCase()) ||
      visitor.visitorName.toLowerCase().includes(code.trim().toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Visitor Check-out"
        description="Enter a visitor code or select someone who is currently inside."
        breadcrumbs={[{ label: 'Home', href: PATHS.security.dashboard }, { label: 'Visitor Check-out' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load visitors.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <Card>
            <TextInput
              label="Visitor Code"
              name="checkoutCode"
              value={code}
              placeholder="VR-1025 or visitor name"
              onChange={(event) => setCode(event.target.value)}
            />
          </Card>

          {matched.length === 0 ? (
            <EmptyState title="No one is currently inside." description="Checked-in visitors will appear here until they leave." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matched.map((visitor) => (
                <Card key={visitor.id}>
                  <CardHeader
                    title={visitor.visitorName}
                    action={<VisitorStatusBadge status={visitor.status} visitor={visitor} />}
                  />
                  <p className="text-sm text-muted">
                    Host {visitor.tenantName} · Room {visitor.roomNumber}
                  </p>
                  <p className="mt-2 text-sm text-muted">Checked in {formatDateTime(visitor.checkedInAt)}</p>
                  <p className="mt-1 text-sm text-muted">Expected exit {formatTime(visitor.expectedExitTime)}</p>
                  {isVisitorOverstay(visitor) ? <p className="mt-2 text-sm font-semibold text-danger">Overstay</p> : null}
                  <Button
                    className="mt-4"
                    fullWidth
                    disabled={savingId === visitor.id}
                    onClick={() => void checkOut(visitor.id, visitor.visitorName)}
                  >
                    Check Out
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
