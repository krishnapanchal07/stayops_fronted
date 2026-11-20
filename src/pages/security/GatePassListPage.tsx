import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { GatePassVerification } from '@/components/leave/GatePassVerification';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { leaveService } from '@/services/leave/leaveService';
import { GATE_PASS_STATUS_LABELS, GatePassStatus, type GatePass } from '@/types/leave';
import type { DataTableColumn } from '@/types/ui';
import { formatDateTime } from '@/utils/format';
import { isReturnOverdue } from '@/utils/leaveRules';
import { useCallback, useMemo, useState } from 'react';

export function GatePassListPage() {
  const toast = useToast();
  const user = useCurrentUser();
  const propertyIds = user?.propertyIds;
  const passesLoader = useCallback(() => leaveService.getGatePasses(propertyIds), [propertyIds]);
  const outLoader = useCallback(() => leaveService.getCurrentlyOut(propertyIds), [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(passesLoader);
  const { data: currentlyOut, reload: reloadOut } = useAsyncResource(outLoader);

  const [code, setCode] = useState('');
  const [pass, setPass] = useState<GatePass | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recording, setRecording] = useState(false);
  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;

  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const outIds = useMemo(() => new Set((currentlyOut ?? []).map((item) => item.id)), [currentlyOut]);
  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (item) =>
          item.status === GatePassStatus.ACTIVE ||
          outIds.has(item.id) ||
          item.startDateTime.slice(0, 10) === today,
      ),
    [data, outIds, today],
  );

  const refresh = () => {
    reload();
    reloadOut();
  };

  const columns: DataTableColumn<GatePass>[] = [
    { id: 'code', header: 'Pass Code', accessor: 'passCode', sortable: true },
    { id: 'tenant', header: 'Tenant', accessor: 'tenantName', sortable: true },
    { id: 'room', header: 'Room', accessor: 'roomNumber', sortable: true },
    {
      id: 'depart',
      header: 'Departure',
      accessor: 'startDateTime',
      sortable: true,
      render: (row) => formatDateTime(row.startDateTime),
    },
    {
      id: 'return',
      header: 'Expected Return',
      accessor: 'expectedReturnDateTime',
      sortable: true,
      render: (row) => formatDateTime(row.expectedReturnDateTime),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <StatusPill value={GATE_PASS_STATUS_LABELS[row.status]} />
          {outIds.has(row.id) && isReturnOverdue(row) ? <StatusPill value="Overdue Return" /> : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCode(row.passCode);
              setPass(row);
              setVerifyError('');
            }}
          >
            Verify
          </Button>
          {row.status === GatePassStatus.ACTIVE ? (
            <Button size="sm" disabled={recording} onClick={() => void recordExit(row)}>
              Record Exit
            </Button>
          ) : null}
          {row.status === GatePassStatus.USED && outIds.has(row.id) ? (
            <Button size="sm" disabled={recording} onClick={() => void recordReturn(row)}>
              Record Return
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const recordExit = async (target: GatePass) => {
    if (!actor) return;
    setRecording(true);
    try {
      const updated = await leaveService.recordExit(target.id, actor, propertyIds);
      setPass(updated);
      toast('success', 'Exit recorded', `${updated.tenantName} is now out.`);
      refresh();
    } catch (cause) {
      toast('error', 'Unable to record exit', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setRecording(false);
    }
  };

  const recordReturn = async (target: GatePass) => {
    if (!actor) return;
    setRecording(true);
    try {
      const result = await leaveService.recordReturn(target.id, actor, propertyIds);
      setPass(result.gatePass);
      toast('success', 'Return recorded', `${result.leave.leaveCode} is completed.`);
      refresh();
    } catch (cause) {
      toast('error', 'Unable to record return', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gate Passes"
        description="Verify student gate passes and record exit or return."
        breadcrumbs={[{ label: 'Home', href: PATHS.security.dashboard }, { label: 'Gate Passes' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load gate passes.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <Card>
            <GatePassVerification
              code={code}
              pass={pass}
              exitAt={(currentlyOut ?? []).find((item) => item.id === pass?.id)?.exitAt}
              error={verifyError}
              verifying={verifying}
              recording={recording}
              onCodeChange={setCode}
              onVerify={async () => {
                setVerifying(true);
                setVerifyError('');
                try {
                  const found = await leaveService.verifyGatePass(code, propertyIds);
                  setPass(found);
                } catch (cause) {
                  setPass(null);
                  setVerifyError(cause instanceof Error ? cause.message : 'Unable to verify gate pass.');
                } finally {
                  setVerifying(false);
                }
              }}
              onRecordExit={() => {
                if (pass) void recordExit(pass);
              }}
              onRecordReturn={() => {
                if (pass) void recordReturn(pass);
              }}
            />
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Currently Out</h2>
            {(currentlyOut ?? []).length === 0 ? (
              <EmptyState title="No one is currently out." description="Recorded exits appear here until the tenant returns." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {(currentlyOut ?? []).map((item) => (
                  <Card key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.tenantName}</p>
                        <p className="typo-helper">
                          Room {item.roomNumber} · {item.passCode}
                        </p>
                      </div>
                      {item.overdue ? <StatusPill value="Overdue Return" /> : <StatusPill value="Out" />}
                    </div>
                    <p className="mt-2 text-sm text-muted">Exit {formatDateTime(item.exitAt)}</p>
                    <p className="text-sm text-muted">Expected return {formatDateTime(item.expectedReturnDateTime)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No active gate passes." description="Approved leave requests generate a gate pass for security." />
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(row) => row.id}
              searchPlaceholder="Search pass code, tenant, room"
              emptyTitle="No active gate passes."
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
