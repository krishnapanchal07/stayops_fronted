import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ROLE_LABELS } from '@/constants/roles';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { PATHS } from '@/routes/paths';
import { auditService } from '@/services/audit/auditService';
import { AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from '@/types/audit';
import { formatDateTime } from '@/utils/format';
import { useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

export function AuditLogDetailsPage() {
  const { auditId = '' } = useParams();
  const loader = useCallback(() => auditService.getAuditLogById(auditId), [auditId]);
  const { data: log, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton cards={3} /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load this audit record.'} onRetry={reload} /> : null}

      {status === 'success' && log ? (
        <>
          <PageHeader
            title={AUDIT_ACTION_LABELS[log.action]}
            description={log.description}
            breadcrumbs={[
              { label: 'Home', href: PATHS.admin.dashboard },
              { label: 'Audit Logs', href: PATHS.admin.auditLogs },
              { label: log.resourceLabel },
            ]}
            showBack
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Event" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Timestamp" value={formatDateTime(log.timestamp)} />
                <InfoRow label="Action" value={<StatusPill value={AUDIT_ACTION_LABELS[log.action]} />} />
                <InfoRow label="Actor" value={log.actorName} />
                <InfoRow label="Role" value={ROLE_LABELS[log.actorRole]} />
                <InfoRow label="Resource" value={`${AUDIT_RESOURCE_LABELS[log.resourceType]} · ${log.resourceLabel}`} />
                <InfoRow label="Resource ID" value={log.resourceId} />
                <InfoRow label="Property" value={log.propertyName ?? '—'} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="Description" />
              <p className="text-sm text-text">{log.description}</p>
              {log.metadata ? (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-background p-3 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
              ) : null}
            </Card>

            {log.oldValue || log.newValue ? (
              <Card className="lg:col-span-2">
                <CardHeader title="Change details" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text">Previous value</h3>
                    <pre className="overflow-x-auto rounded-xl bg-background p-3 text-xs">
                      {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : '—'}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text">New value</h3>
                    <pre className="overflow-x-auto rounded-xl bg-background p-3 text-xs">
                      {log.newValue ? JSON.stringify(log.newValue, null, 2) : '—'}
                    </pre>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text">{value}</dd>
    </div>
  );
}
