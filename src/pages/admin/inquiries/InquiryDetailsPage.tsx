import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConvertInquiryModal } from '@/components/inquiries/ConvertInquiryModal';
import { InquiryStatusModal } from '@/components/inquiries/InquiryStatusModal';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, tenantDetailPath, wardenTenantDetailPath } from '@/routes/paths';
import { inquiryService } from '@/services/inquiry/inquiryService';
import { INQUIRY_STATUS_LABELS, InquiryStatus } from '@/types/inquiry';
import { SHARING_TYPE_LABELS } from '@/types/room';
import { formatINR, formatPhone, formatShortDate } from '@/utils/format';
import { allowedInquiryTransitions, isOpenInquiry } from '@/utils/inquiryStats';
import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

export function InquiryDetailsPage() {
  const { inquiryId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const isTenantPath = location.pathname.startsWith('/tenant');
  const canManage = useHasPermission(Permission.INQUIRY_MANAGE);
  const canConvert = useHasPermission(Permission.TENANT_CREATE);
  const listPath = isTenantPath ? PATHS.tenant.inquiries : isWarden ? PATHS.warden.inquiries : PATHS.admin.inquiries;

  const loader = useCallback(() => {
    if (isTenantPath && user) {
      return inquiryService.getMyInquiryById(inquiryId, user.email, user.id);
    }
    return inquiryService.getInquiryById(inquiryId, isWarden ? user?.propertyIds : undefined);
  }, [inquiryId, isTenantPath, isWarden, user]);
  const { data: inquiry, status, error, reload } = useAsyncResource(loader);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertSaving, setConvertSaving] = useState(false);
  const [bedAvailable, setBedAvailable] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const openConvert = async () => {
    if (!inquiry?.bedId) {
      setBedAvailable(false);
      setConvertOpen(true);
      return;
    }
    try {
      const availability = await inquiryService.getInventoryAvailability();
      setBedAvailable(availability[inquiry.roomId]?.[inquiry.bedId] === true);
      setConvertOpen(true);
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to check bed availability.');
    }
  };

  const tenantPath = inquiry?.tenantId
    ? isWarden
      ? wardenTenantDetailPath(inquiry.tenantId)
      : tenantDetailPath(inquiry.tenantId)
    : null;

  return (
    <div>
      <PageHeader
        title={inquiry?.fullName ?? 'Inquiry'}
        description={inquiry ? `${inquiry.listingTitle} · ${inquiry.propertyName}` : undefined}
        breadcrumbs={[{ label: 'Inquiries', href: listPath }, { label: 'Inquiry Details' }]}
        actions={
          inquiry ? (
            <div className="flex flex-wrap gap-2">
              {isTenantPath && isOpenInquiry(inquiry) ? (
                <Button
                  variant="outline"
                  disabled={withdrawing}
                  onClick={async () => {
                    if (!user) return;
                    setWithdrawing(true);
                    try {
                      await inquiryService.withdrawInquiry(inquiry.id, user.email, user.id, user.name);
                      toast('success', 'Inquiry withdrawn', 'Your request is no longer in the review pipeline.');
                      reload();
                    } catch (cause) {
                      toast('error', 'Unable to withdraw', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setWithdrawing(false);
                    }
                  }}
                >
                  Withdraw
                </Button>
              ) : null}
              {canManage && !isTenantPath && allowedInquiryTransitions(inquiry.status).length > 0 ? (
                <Button variant="outline" onClick={() => setStatusOpen(true)}>
                  Change Status
                </Button>
              ) : null}
              {canConvert && inquiry.kind === 'ROOM' && inquiry.status === InquiryStatus.APPROVED ? (
                <Button onClick={() => void openConvert()}>Convert to Tenant</Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this inquiry.'} onRetry={reload} />
      ) : null}

      {status === 'success' && inquiry ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Inquirer" />
            <dl className="space-y-3 text-sm">
              <Detail label="Name" value={inquiry.fullName} />
              <Detail label="Email" value={inquiry.email} />
              <Detail label="Phone" value={formatPhone(inquiry.phone)} />
              <Detail label="Preferred move-in" value={formatShortDate(inquiry.preferredMoveIn)} />
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="mt-1">
                  <StatusPill value={INQUIRY_STATUS_LABELS[inquiry.status]} />
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title={inquiry.kind === 'ROOM' ? 'Requested Room' : 'General inquiry'} />
            <dl className="space-y-3 text-sm">
              <Detail label="Listing" value={inquiry.listingTitle} />
              <Detail label="Property" value={inquiry.propertyName} />
              <Detail label="Sharing" value={inquiry.sharingType ? SHARING_TYPE_LABELS[inquiry.sharingType] : 'Not applicable'} />
              <Detail label="Rent" value={`${formatINR(inquiry.monthlyRent)} /month`} />
              <Detail label="Inquiry ID" value={inquiry.id} />
              {tenantPath ? (
                <div>
                  <dt className="text-muted">Tenant</dt>
                  <dd className="mt-1">
                    <Link to={tenantPath} className="font-medium text-primary hover:underline">
                      Open tenant record
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Message" />
            <p className="typo-secondary">{inquiry.message}</p>
          </Card>

          <Card>
            <CardHeader title="Status History" />
            <ol className="space-y-3">
              {inquiry.statusHistory.map((event) => (
                <li key={event.id} className="border-l-2 border-primary-soft pl-3">
                  <p className="text-sm font-medium text-text">
                    {event.from ? `${INQUIRY_STATUS_LABELS[event.from]} → ` : ''}
                    {INQUIRY_STATUS_LABELS[event.to]}
                  </p>
                  <p className="typo-helper">
                    {event.actor} · {event.occurredAt.replace('T', ' ')}
                  </p>
                  {event.note ? <p className="typo-secondary mt-1">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ) : null}

      <InquiryStatusModal
        key={inquiry ? `${inquiry.id}-${inquiry.status}` : 'status-closed'}
        open={statusOpen}
        inquiry={inquiry}
        submitting={statusSaving}
        onClose={() => setStatusOpen(false)}
        onSubmit={async (nextStatus, note) => {
          if (!inquiry) return;
          setStatusSaving(true);
          try {
            await inquiryService.changeInquiryStatus(
              inquiry.id,
              nextStatus,
              user?.name ?? 'StayOps Admin',
              note,
              isWarden ? user?.propertyIds : undefined,
            );
            toast('success', 'Inquiry updated', `Status is now ${INQUIRY_STATUS_LABELS[nextStatus]}.`);
            setStatusOpen(false);
            reload();
          } catch (cause) {
            toast('error', 'Unable to update inquiry', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setStatusSaving(false);
          }
        }}
      />

      <ConvertInquiryModal
        key={inquiry?.id ?? 'convert-closed'}
        open={convertOpen}
        inquiry={inquiry}
        bedAvailable={bedAvailable}
        submitting={convertSaving}
        onClose={() => setConvertOpen(false)}
        onSubmit={async (allocateBed) => {
          if (!inquiry) return;
          setConvertSaving(true);
          try {
            const result = await inquiryService.convertInquiryToTenant(
              inquiry.id,
              {
                allocateBed,
                actor: user?.name ?? 'StayOps Admin',
              },
              isWarden ? user?.propertyIds : undefined,
            );
            toast('success', 'Tenant created', `${result.tenant.fullName} is now in onboarding.`);
            setConvertOpen(false);
            navigate(isWarden ? wardenTenantDetailPath(result.tenant.id) : tenantDetailPath(result.tenant.id));
          } catch (cause) {
            toast('error', 'Unable to convert inquiry', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setConvertSaving(false);
          }
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-text">{value}</dd>
    </div>
  );
}
