import { Avatar } from '@/components/common/Avatar';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TenantCheckoutModal } from '@/components/tenants/TenantCheckoutModal';
import { TenantForm } from '@/components/tenants/TenantForm';
import { TenantStatusModal } from '@/components/tenants/TenantStatusModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import {
  PATHS,
  buildingDetailPath,
  inquiryDetailPath,
  propertyDetailPath,
  roomDetailPath,
  wardenInquiryDetailPath,
} from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import {
  TENANT_GENDER_LABELS,
  TENANT_SOURCE_LABELS,
  TENANT_STATUS_LABELS,
  TenantStatus,
  type Tenant,
  type TenantFormValues,
} from '@/types/tenant';
import { formatINR, formatPhone, formatShortDate } from '@/utils/format';
import { toTenantFormValues } from '@/utils/tenantValidation';
import { Pencil } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const documentStatusLabel = {
  PENDING: 'Pending',
  UPLOADED: 'Uploaded',
  VERIFIED: 'Verified',
  EXPIRED: 'Expired',
} as const;

export function TenantDetailsPage() {
  const { tenantId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const canEdit = useHasPermission(Permission.TENANT_EDIT);
  const canAssignRoom = useHasPermission(Permission.ROOM_ALLOCATE);
  const canViewPayments = useHasPermission(Permission.PAYMENT_VIEW);
  const canViewComplaints = useHasPermission(Permission.COMPLAINT_VIEW);
  const canViewVisitors = useHasPermission(Permission.VISITOR_VIEW);
  const canViewLeave = useHasPermission(Permission.LEAVE_VIEW);
  const homeHref = isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const listHref = isWarden ? PATHS.warden.tenants : PATHS.admin.tenants;
  const propertyIds = user?.roleId === 'SUPER_ADMIN' ? undefined : user?.propertyIds;

  const tenantLoader = useCallback(() => tenantService.getTenantById(tenantId, propertyIds), [propertyIds, tenantId]);
  const tenantsLoader = useCallback(() => tenantService.getTenants(propertyIds), [propertyIds]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!propertyIds) return properties;
    return properties.filter((property) => propertyIds.includes(property.id));
  }, [propertyIds]);
  const roomsLoader = useCallback(async () => {
    const rooms = await tenantService.getAllocationRooms();
    if (!propertyIds) return rooms;
    return rooms.filter((room) => propertyIds.includes(room.propertyId));
  }, [propertyIds]);
  const activityLoader = useCallback(() => tenantService.getTenantActivity(tenantId, propertyIds), [propertyIds, tenantId]);
  const documentsLoader = useCallback(() => tenantService.getTenantDocuments(tenantId, propertyIds), [propertyIds, tenantId]);
  const paymentsLoader = useCallback(() => tenantService.getTenantPaymentsSummary(tenantId, propertyIds), [propertyIds, tenantId]);
  const complaintsLoader = useCallback(() => tenantService.getTenantComplaintsSummary(tenantId, propertyIds), [propertyIds, tenantId]);
  const visitorsLoader = useCallback(() => tenantService.getTenantVisitorsSummary(tenantId, propertyIds), [propertyIds, tenantId]);
  const leaveLoader = useCallback(() => tenantService.getTenantLeaveSummary(tenantId, propertyIds), [propertyIds, tenantId]);

  const { data: tenant, status, error, reload } = useAsyncResource(tenantLoader);
  const { data: tenants } = useAsyncResource(tenantsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: rooms, reload: reloadRooms } = useAsyncResource(roomsLoader);
  const { data: activity } = useAsyncResource(activityLoader);
  const { data: documents } = useAsyncResource(documentsLoader);
  const { data: payments } = useAsyncResource(paymentsLoader);
  const { data: complaints } = useAsyncResource(complaintsLoader);
  const { data: visitors } = useAsyncResource(visitorsLoader);
  const { data: leave } = useAsyncResource(leaveLoader);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [pendingValues, setPendingValues] = useState<TenantFormValues | null>(null);

  const commitSave = async (values: TenantFormValues) => {
    if (!tenant) return;
    setSaving(true);
    try {
      await tenantService.updateTenant(tenant.id, values, propertyIds);
      toast('success', 'Tenant updated successfully.');
      setFormOpen(false);
      setPendingValues(null);
      reload();
      reloadRooms();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (values: TenantFormValues) => {
    if (tenant?.bedId && values.bedId && tenant.bedId !== values.bedId) {
      setPendingValues(values);
      return;
    }
    await commitSave(values);
  };

  const handleStatusChange = async (nextStatus: Tenant['status']) => {
    if (!tenant) return;
    setStatusSaving(true);
    try {
      await tenantService.changeTenantStatus(tenant.id, nextStatus, propertyIds);
      toast(
        'success',
        nextStatus === TenantStatus.INACTIVE
          ? 'Tenant deactivated successfully.'
          : nextStatus === TenantStatus.ACTIVE
            ? 'Tenant activated successfully.'
            : 'Tenant status updated successfully.',
      );
      setStatusOpen(false);
      reload();
      reloadRooms();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update tenant status.');
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton cards={6} /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this tenant.'} onRetry={reload} />
      ) : null}

      {status === 'success' && tenant ? (
        <>
          <p className="typo-helper mb-4">Tenant profiles, allocations and financial records are persistent. Complaints, visitors, leave and document storage are not connected to these profiles yet.</p>
          <PageHeader
            title={tenant.fullName}
            description={tenant.tenantCode}
            breadcrumbs={[
              { label: 'Home', href: homeHref },
              { label: 'Tenants', href: listHref },
              { label: tenant.fullName },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill value={TENANT_STATUS_LABELS[tenant.status]} />
                {canEdit ? (
                  <>
                    {user?.roleId === 'SUPER_ADMIN' ? <Button variant="outline" disabled={inviting} onClick={async () => {
                      if (inviting) return;
                      setInviting(true);
                      try {
                        const result = await tenantService.inviteTenant(tenant.id);
                        toast('success', result.message);
                      } catch (cause) {
                        toast('error', cause instanceof Error ? cause.message : 'Unable to send invitation.');
                      } finally { setInviting(false); }
                    }}>{inviting ? 'Sending…' : 'Send account invitation'}</Button> : null}
                    <Button variant="outline" onClick={() => setStatusOpen(true)}>
                      Change Status
                    </Button>
                    <Button variant="outline" onClick={() => setCheckoutOpen(true)}>
                      Start Checkout
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

          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={tenant.profileImage} name={tenant.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-text">{tenant.fullName}</p>
                  <p className="typo-helper">
                    {tenant.tenantCode} · {TENANT_SOURCE_LABELS[tenant.source]}
                    {tenant.inquiryId ? (
                      <>
                        {' · '}
                        <Link
                          to={isWarden ? wardenInquiryDetailPath(tenant.inquiryId) : inquiryDetailPath(tenant.inquiryId)}
                          className="text-primary hover:underline"
                        >
                          {tenant.inquiryId}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader title="Personal Information" />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Email" value={tenant.email} />
                  <InfoRow label="Phone" value={formatPhone(tenant.phone)} />
                  <InfoRow label="Date of birth" value={formatShortDate(tenant.dateOfBirth)} />
                  <InfoRow label="Gender" value={tenant.gender ? TENANT_GENDER_LABELS[tenant.gender] : '—'} />
                  <InfoRow
                    label="Address"
                    value={
                      tenant.address
                        ? [tenant.address.addressLine1, tenant.address.addressLine2, tenant.address.city, tenant.address.state, tenant.address.postalCode, tenant.address.country]
                            .filter(Boolean)
                            .join(', ')
                        : '—'
                    }
                  />
                </dl>
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="typo-label mb-3">Emergency Contact</h3>
                  {tenant.emergencyContact ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <InfoRow label="Name" value={tenant.emergencyContact.name} />
                      <InfoRow label="Relationship" value={tenant.emergencyContact.relationship} />
                      <InfoRow label="Phone" value={formatPhone(tenant.emergencyContact.phone)} />
                      <InfoRow label="Email" value={tenant.emergencyContact.email ?? '—'} />
                    </dl>
                  ) : (
                    <p className="typo-secondary">No emergency contact added yet.</p>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Current Stay" />
                {tenant.roomId ? (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      label="Property"
                      value={
                        tenant.propertyId && !isWarden ? (
                          <Link className="text-primary hover:underline" to={propertyDetailPath(tenant.propertyId)}>
                            {tenant.propertyName}
                          </Link>
                        ) : (
                          tenant.propertyName ?? '—'
                        )
                      }
                    />
                    <InfoRow
                      label="Building"
                      value={
                        tenant.propertyId && tenant.buildingId && !isWarden ? (
                          <Link
                            className="text-primary hover:underline"
                            to={buildingDetailPath(tenant.propertyId, tenant.buildingId)}
                          >
                            {tenant.buildingName}
                          </Link>
                        ) : (
                          tenant.buildingName ?? '—'
                        )
                      }
                    />
                    <InfoRow label="Floor" value={tenant.floorName ?? '—'} />
                    <InfoRow
                      label="Room"
                      value={
                        tenant.roomId && !isWarden ? (
                          <Link className="text-primary hover:underline" to={roomDetailPath(tenant.roomId)}>
                            Room {tenant.roomNumber}
                          </Link>
                        ) : tenant.roomNumber ? (
                          `Room ${tenant.roomNumber}`
                        ) : (
                          '—'
                        )
                      }
                    />
                    <InfoRow label="Bed" value={tenant.bedLabel ?? '—'} />
                    <InfoRow label="Monthly rent" value={tenant.roomRent ? `${formatINR(tenant.roomRent)}/month` : '—'} />
                    <InfoRow
                      label="Security deposit"
                      value={tenant.securityDeposit != null ? formatINR(tenant.securityDeposit) : '—'}
                    />
                    <InfoRow label="Move-in" value={formatShortDate(tenant.moveInDate)} />
                    <InfoRow label="Expected move-out" value={formatShortDate(tenant.expectedMoveOutDate)} />
                  </dl>
                ) : (
                  <p className="typo-secondary">
                    This tenant is not assigned to a room yet. Onboarding and inquiry conversion can complete allocation later.
                  </p>
                )}
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader
                  title="Financial Summary"
                  action={
                    canViewPayments ? (
                      <Button size="sm" variant="ghost" onClick={() => toast('info', 'Payments', 'Full payments arrive in a later phase.')}>
                        View Payments
                      </Button>
                    ) : null
                  }
                />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Monthly rent" value={formatINR(tenant.roomRent ?? 0)} />
                  <InfoRow label="Paid this month" value={payments ? formatINR(payments.paidThisMonth) : 'Unavailable'} />
                  <InfoRow label="Outstanding" value={payments ? formatINR(payments.outstanding) : 'Unavailable'} />
                  <InfoRow label="Security deposit" value={formatINR(tenant.securityDeposit ?? 0)} />
                </dl>
              </Card>

              <Card>
                <CardHeader
                  title="Complaints"
                  action={
                    canViewComplaints ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(isWarden ? PATHS.warden.complaints : PATHS.admin.complaints)}
                      >
                        View Complaints
                      </Button>
                    ) : null
                  }
                />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Open complaints" value={complaints ? String(complaints.open) : 'Unavailable'} />
                  <InfoRow label="Resolved complaints" value={complaints ? String(complaints.resolved) : 'Unavailable'} />
                  <InfoRow label="Last complaint" value={complaints?.lastComplaint ?? '—'} />
                </dl>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader
                  title="Visitors"
                  action={
                    canViewVisitors ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(isWarden ? PATHS.warden.visitors : PATHS.admin.visitors)}
                      >
                        View Visitors
                      </Button>
                    ) : null
                  }
                />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Total visitors" value={visitors ? String(visitors.total) : 'Unavailable'} />
                  <InfoRow label="Upcoming visitors" value={visitors ? String(visitors.upcoming) : 'Unavailable'} />
                  <InfoRow label="Last visit" value={visitors?.lastVisit ?? '—'} />
                </dl>
              </Card>

              <Card>
                <CardHeader
                  title="Leave"
                  action={
                    canViewLeave ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(isWarden ? PATHS.warden.leaveRequests : PATHS.admin.leaveRequests)}
                      >
                        View Leave Requests
                      </Button>
                    ) : null
                  }
                />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Pending requests" value={leave ? String(leave.pending) : 'Unavailable'} />
                  <InfoRow label="Approved requests" value={leave ? String(leave.approved) : 'Unavailable'} />
                  <InfoRow label="Last leave" value={leave?.lastLeave ?? '—'} />
                </dl>
              </Card>
            </div>

            <ActivityList
              title="Activity"
              items={(activity ?? []).map((event) => ({
                id: event.id,
                title: event.action,
                detail: `${event.actor} · ${event.description}`,
                time: formatActivityTime(event.occurredAt),
              }))}
              emptyTitle="No activity recorded yet."
            />

            <Card>
              <CardHeader title="Documents" />
                <p className="typo-helper">Document storage is not connected yet.</p>
              {documents && documents.length > 0 ? (
                <ul className="space-y-3">
                  {documents.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                      <div>
                        <p className="font-medium text-text">{document.name}</p>
                        <p className="typo-helper">{document.type}</p>
                      </div>
                      <div className="text-right">
                        <StatusPill value={documentStatusLabel[document.status]} />
                        <p className="typo-muted mt-1">{formatShortDate(document.uploadedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="typo-secondary">No documents on file yet.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Internal Notes" />
              <p className="typo-helper mb-2">Admin and warden only. Not shown on tenant self-service.</p>
              <p className="text-sm text-text">{tenant.internalNotes || 'No internal notes yet.'}</p>
            </Card>
          </div>

          <Modal open={formOpen} title="Edit Tenant" onClose={() => setFormOpen(false)} className="max-w-2xl">
            <TenantForm
              key={tenant.id}
              mode="edit"
              properties={properties ?? []}
              rooms={rooms ?? []}
              tenants={tenants ?? []}
              editingId={tenant.id}
              initialValues={toTenantFormValues(tenant)}
              submitting={saving}
              canAssignRoom={canAssignRoom}
              onSubmit={handleSave}
              onCancel={() => setFormOpen(false)}
            />
          </Modal>

          <Modal
            open={Boolean(pendingValues)}
            title="Change room assignment?"
            onClose={() => setPendingValues(null)}
            footer={
              <>
                <Button variant="outline" onClick={() => setPendingValues(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={() => pendingValues && commitSave(pendingValues)} disabled={saving || !pendingValues}>
                  {saving ? 'Updating…' : 'Move Tenant'}
                </Button>
              </>
            }
          >
            <p className="typo-secondary">
              The current bed will become available and the selected bed will be marked occupied.
            </p>
          </Modal>

          <TenantStatusModal
            key={`${tenant.id}-${tenant.status}`}
            open={statusOpen}
            tenant={tenant}
            submitting={statusSaving}
            onClose={() => setStatusOpen(false)}
            onSubmit={handleStatusChange}
          />

          <TenantCheckoutModal key={tenant.id + String(checkoutOpen)} open={checkoutOpen} tenant={tenant} onClose={() => setCheckoutOpen(false)} onComplete={() => { reload(); reloadRooms(); }} />
        </>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words text-text">{value}</dd>
    </div>
  );
}

function formatActivityTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
