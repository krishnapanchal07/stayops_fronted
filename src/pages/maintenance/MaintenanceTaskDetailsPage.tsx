import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { CompleteTaskModal } from '@/components/maintenance/CompleteTaskModal';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, complaintDetailPath } from '@/routes/paths';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import { COMPLAINT_PRIORITY_LABELS } from '@/types/complaint';
import { MAINTENANCE_STATUS_LABELS } from '@/types/maintenance';
import { canCompleteMaintenanceTask, canStartMaintenanceTask } from '@/utils/maintenanceRules';
import { formatDateTime, formatINR, formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';

export function MaintenanceTaskDetailsPage() {
  const { taskId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isAdmin = location.pathname.startsWith('/admin');
  const canUpdate = useHasPermission(Permission.MAINTENANCE_UPDATE);
  const listHref = isAdmin ? PATHS.admin.maintenance : PATHS.maintenance.tasks;

  const loader = useCallback(() => {
    if (isAdmin) return maintenanceService.getMaintenanceTaskById(taskId);
    if (user) return maintenanceService.getMyTaskById(taskId, user.id);
    return Promise.reject(new Error('Maintenance task not found.'));
  }, [isAdmin, taskId, user]);
  const { data: task, status, error, reload } = useAsyncResource(loader);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;

  return (
    <div>
      <PageHeader
        title={task?.title ?? 'Maintenance Task'}
        description={task ? `${task.taskCode} · ${task.complaintCode}` : undefined}
        breadcrumbs={[{ label: 'Tasks', href: listHref }, { label: 'Task Details' }]}
        showBack
        actions={
          task && actor && canUpdate ? (
            <div className="flex flex-wrap gap-2">
              {canStartMaintenanceTask(task.status) ? (
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await maintenanceService.startTask(task.id, actor);
                      toast('success', 'Task started successfully.', 'The complaint is now in progress.');
                      reload();
                    } catch (cause) {
                      toast('error', 'Unable to update task', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {task.status === 'PENDING' ? 'Accept Task' : 'Start Work'}
                </Button>
              ) : null}
              {canCompleteMaintenanceTask(task.status) ? (
                <Button onClick={() => setCompleteOpen(true)}>Mark Completed</Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this task.'} onRetry={reload} />
      ) : null}

      {status === 'success' && task ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Task Details" />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="typo-muted">Task ID</dt>
                <dd className="mt-1 font-medium">{task.taskCode}</dd>
              </div>
              <div>
                <dt className="typo-muted">Complaint</dt>
                <dd className="mt-1">
                  {isAdmin ? (
                    <Link to={complaintDetailPath(task.complaintId)} className="font-medium text-primary">
                      {task.complaintCode}
                    </Link>
                  ) : (
                    task.complaintCode
                  )}
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Property</dt>
                <dd className="mt-1">{task.propertyName}</dd>
              </div>
              <div>
                <dt className="typo-muted">Room</dt>
                <dd className="mt-1">{task.roomNumber}</dd>
              </div>
              <div>
                <dt className="typo-muted">Priority</dt>
                <dd className="mt-1">
                  <StatusPill value={COMPLAINT_PRIORITY_LABELS[task.priority]} />
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Status</dt>
                <dd className="mt-1">
                  <StatusPill value={MAINTENANCE_STATUS_LABELS[task.status]} />
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Assigned Staff</dt>
                <dd className="mt-1">{task.assignedToName ?? '—'}</dd>
              </div>
              <div>
                <dt className="typo-muted">Scheduled</dt>
                <dd className="mt-1">{task.scheduledDate ? formatShortDate(task.scheduledDate) : '—'}</dd>
              </div>
              <div>
                <dt className="typo-muted">Due Date</dt>
                <dd className="mt-1">{formatDateTime(task.dueDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Estimated Cost</dt>
                <dd className="mt-1">{task.estimatedCost != null ? formatINR(task.estimatedCost) : '—'}</dd>
              </div>
              <div>
                <dt className="typo-muted">Actual Cost</dt>
                <dd className="mt-1">{task.actualCost != null ? formatINR(task.actualCost) : '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="typo-muted">Parts Used</dt>
                <dd className="mt-1">{task.partsUsed || '—'}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Issue & Notes" />
            <p className="text-sm text-text">{task.description}</p>
            {task.resolutionNotes ? (
              <div className="mt-4">
                <p className="typo-muted">Resolution</p>
                <p className="mt-1 text-sm text-text">{task.resolutionNotes}</p>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      <CompleteTaskModal
        key={task?.id ?? 'complete'}
        open={completeOpen}
        submitting={saving}
        onClose={() => setCompleteOpen(false)}
        onSubmit={async (values) => {
          if (!task || !actor) return;
          setSaving(true);
          try {
            await maintenanceService.completeMaintenanceTask(task.id, values, actor);
            toast('success', 'Task completed', 'The linked complaint is now resolved.');
            setCompleteOpen(false);
            reload();
          } catch (cause) {
            toast('error', 'Unable to update task', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
