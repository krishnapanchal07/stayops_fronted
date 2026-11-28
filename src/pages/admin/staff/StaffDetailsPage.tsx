import { Avatar } from '@/components/common/Avatar';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StaffForm } from '@/components/staff/StaffForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import { staffService } from '@/services/staff/staffService';
import { MAINTENANCE_STATUS_LABELS } from '@/types/maintenance';
import {
  STAFF_DEPARTMENT_LABELS,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  StaffRole,
  StaffStatus,
  type StaffFormValues,
} from '@/types/staff';
import { formatPhone, formatShortDate } from '@/utils/format';
import { toStaffFormValues } from '@/utils/staffValidation';
import { Pencil } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

export function StaffDetailsPage() {
  const { staffId = '' } = useParams();
  const toast = useToast();
  const canEdit = useHasPermission(Permission.STAFF_EDIT);
  const user = useCurrentUser();
  const staffLoader = useCallback(() => staffService.getStaffById(staffId), [staffId]);
  const propertiesLoader = useCallback(() => staffService.getAssignableProperties(), []);
  const { data: staff, status, error, reload } = useAsyncResource(staffLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const tasksLoader = useCallback(async () => {
    if (!staff?.userId || staff.role !== StaffRole.MAINTENANCE) return [];
    return maintenanceService.getMaintenanceTasksByStaff(staff.userId);
  }, [staff]);
  const { data: tasks } = useAsyncResource(tasksLoader);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const handleSave = async (values: StaffFormValues) => {
    if (!staff || saving) return;
    setSaving(true);
    try {
      await staffService.updateStaff(staff.id, values);
      toast('success', 'Staff updated successfully.');
      setFormOpen(false);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update staff.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!staff || statusSaving) return;
    setStatusSaving(true);
    try {
      if (staff.status === StaffStatus.INACTIVE) {
        await staffService.activateStaff(staff.id);
        toast('success', `${staff.fullName} is now active.`);
      } else {
        await staffService.deactivateStaff(staff.id);
        toast('success', `${staff.fullName} has been deactivated.`);
      }
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update staff status.');
    } finally { setStatusSaving(false); }
  };

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton cards={4} /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load this staff member.'} onRetry={reload} /> : null}

      {status === 'success' && staff ? (
        <>
          <PageHeader
            title={staff.fullName}
            description={`${staff.employeeCode} · ${STAFF_ROLE_LABELS[staff.role]}`}
            breadcrumbs={[
              { label: 'Home', href: PATHS.admin.dashboard },
              { label: 'Staff', href: PATHS.admin.staff },
              { label: staff.fullName },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill value={STAFF_STATUS_LABELS[staff.status]} />
                {user?.roleId === 'SUPER_ADMIN' ? <Button variant="outline" disabled={inviting || (!staff.accountLinkPending && !staff.accountEnabled)} onClick={async () => {
                  if (inviting) return;
                  setInviting(true);
                  try { const result = await staffService.resendInvitation(staff.id); toast('success', result.message); }
                  catch (cause) { toast('error', cause instanceof Error ? cause.message : 'Unable to resend invitation.'); }
                  finally { setInviting(false); }
                }}>{inviting ? 'Sending…' : 'Resend invitation'}</Button> : null}
                {canEdit && !staff.accountLinkPending ? (
                  <>
                    <Button variant="outline" disabled={statusSaving} onClick={() => void toggleStatus()}>
                      {staff.status === StaffStatus.INACTIVE ? 'Activate' : 'Deactivate'}
                    </Button>
                    <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                      Edit
                    </Button>
                  </>
                ) : null}
              </div>
            }
            showBack
          />

          {staff.accountLinkPending ? <p role="status" className="mb-4 rounded-xl bg-warning-soft p-4 text-sm">This existing account must accept the email invitation before the proposed property assignments take effect. Its current password and access are unchanged.</p> : null}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar src={staff.profileImage} name={staff.fullName} size="lg" />
                  <div>
                    <h2 className="text-xl font-bold text-text">{staff.fullName}</h2>
                    <p className="typo-helper mt-1">{staff.designation}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Profile" />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Employee ID" value={staff.employeeCode} />
                  <InfoRow label="Role" value={STAFF_ROLE_LABELS[staff.role]} />
                  <InfoRow label="Department" value={STAFF_DEPARTMENT_LABELS[staff.department]} />
                  <InfoRow label="Joining date" value={formatShortDate(staff.joiningDate)} />
                  {staff.userId ? <InfoRow label="Linked login" value={staff.userId} /> : null}
                </dl>
              </Card>

              <Card>
                <CardHeader title="Contact" />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Email" value={staff.email} />
                  <InfoRow label="Phone" value={formatPhone(staff.phone)} />
                  <InfoRow
                    label="Address"
                    value={`${staff.address.addressLine1}${staff.address.addressLine2 ? `, ${staff.address.addressLine2}` : ''}, ${staff.address.city}, ${staff.address.state}`}
                  />
                  <InfoRow
                    label="Emergency contact"
                    value={`${staff.emergencyContact.name} · ${formatPhone(staff.emergencyContact.phone)}`}
                  />
                </dl>
              </Card>

              {staff.role === StaffRole.MAINTENANCE ? (
                <Card>
                  <CardHeader title="Assigned tasks" />
                  {tasks && tasks.length > 0 ? (
                    <ul className="space-y-3">
                      {tasks.slice(0, 6).map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-text">{task.title}</p>
                            <p className="typo-helper">{task.taskCode}</p>
                          </div>
                          <StatusPill value={MAINTENANCE_STATUS_LABELS[task.status]} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="typo-secondary">No maintenance tasks assigned.</p>
                  )}
                </Card>
              ) : null}
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader title="Property assignment" />
                <p className="text-sm font-medium text-text">
                  {staff.propertyNames.length > 0 ? staff.propertyNames.join(', ') : 'Not assigned'}
                </p>
                {staff.role === StaffRole.WARDEN ? (
                  <p className="typo-helper mt-2">Warden operational scope is limited to these properties.</p>
                ) : null}
                {staff.role === StaffRole.ACCOUNTANT ? (
                  <p className="typo-helper mt-2">Finance screens for this accountant cover the assigned properties.</p>
                ) : null}
                {staff.role === StaffRole.SECURITY ? (
                  <p className="typo-helper mt-2">Gate operations are scoped to the assigned site.</p>
                ) : null}
              </Card>
            </div>
          </div>

          <Modal open={formOpen} title="Edit Staff" onClose={() => { if (!saving) setFormOpen(false); }} className="max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
            <StaffForm
              key={staff.id}
              mode="edit"
              properties={properties ?? []}
              initialValues={toStaffFormValues(staff)}
              submitting={saving}
              linkedAccount={Boolean(staff.userId)}
              onSubmit={handleSave}
              onCancel={() => setFormOpen(false)}
            />
          </Modal>
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
