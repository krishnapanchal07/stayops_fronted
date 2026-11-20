import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS, tenantInquiryDetailPath } from '@/routes/paths';
import { inquiryService } from '@/services/inquiry/inquiryService';
import { INQUIRY_STATUS_LABELS } from '@/types/inquiry';
import { formatINR, formatShortDate } from '@/utils/format';
import { Search } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function MyInquiriesPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const loader = useCallback(() => {
    if (!user) return Promise.resolve([]);
    return inquiryService.getMyInquiries(user.email, user.id);
  }, [user]);
  const { data, status, error, reload } = useAsyncResource(loader);
  const inquiries = data ?? [];

  return (
    <div>
      <PageHeader
        title="My Inquiries"
        description="Track room requests you have submitted from Find Room."
        breadcrumbs={[{ label: 'Home', href: PATHS.tenant.dashboard }, { label: 'My Inquiries' }]}
        actions={
          <Button leftIcon={<Search className="h-4 w-4" />} onClick={() => navigate(PATHS.tenant.findRoom)}>
            Find Room
          </Button>
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load your inquiries.'} onRetry={reload} />
      ) : null}

      {status === 'success' && inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description="Browse available beds and apply. Inquiry records stay separate from your tenant profile."
          actionLabel="Find a room"
          onAction={() => navigate(PATHS.tenant.findRoom)}
        />
      ) : null}

      {status === 'success' && inquiries.length > 0 ? (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-text">{inquiry.listingTitle}</p>
                  <p className="typo-secondary mt-0.5">{inquiry.propertyName}</p>
                  <p className="typo-helper mt-1">
                    Submitted {formatShortDate(inquiry.createdAt)} · {formatINR(inquiry.monthlyRent)} /month
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={INQUIRY_STATUS_LABELS[inquiry.status]} />
                  <Button variant="outline" size="sm" onClick={() => navigate(tenantInquiryDetailPath(inquiry.id))}>
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
