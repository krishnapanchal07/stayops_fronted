import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FaqAccordion } from '@/components/help/FaqAccordion';
import { SupportForm } from '@/components/support/SupportForm';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { supportService } from '@/services/support/supportService';
import { tenantService } from '@/services/tenant/tenantService';
import type { SupportFormValues } from '@/types/support';
import { formatPhone } from '@/utils/format';
import { emptySupportForm, validateSupportForm, type SupportFormErrors } from '@/utils/supportValidation';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  { id: 'pay', question: 'How do I pay rent?', answer: 'Open Payments from the sidebar, choose the open invoice, and use Pay Now. A receipt is created after a successful mock payment.' },
  { id: 'complaint', question: 'How do I raise a complaint?', answer: 'Use Complaints for physical or maintenance issues such as leaking pipes or Wi-Fi outages. Support is for account and document questions.' },
  { id: 'visitor', question: 'How do I add a visitor?', answer: 'Go to Visitors, submit a request, then wait for warden or admin approval before the visitor can check in at the gate.' },
  { id: 'leave', question: 'How do I apply for leave?', answer: 'Open Leave / Gate Pass, submit the dates, and wait for approval. Security records exit and return against the gate pass.' },
  { id: 'invoice', question: 'How do I download my invoice?', answer: 'Open Payments, select an invoice, and use the invoice or receipt view. Documents may also link to the same finance record.' },
  { id: 'contact', question: 'How do I contact management?', answer: 'Use the property contact details on this page, or create a support request for account and document issues.' },
];

export function HelpPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();
  const tenantId = user?.id ?? '';

  const loader = useCallback(async () => {
    if (!tenantId) throw new Error('Unable to load help.');
    const tenant = await tenantService.getTenantById(tenantId);
    const property = tenant.propertyId ? await propertyService.getPropertyById(tenant.propertyId) : null;
    return { tenant, property };
  }, [tenantId]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const [formValues, setFormValues] = useState<SupportFormValues>(emptySupportForm());
  const [formErrors, setFormErrors] = useState<SupportFormErrors>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!tenantId) return;
    const errors = validateSupportForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const created = await supportService.createSupportRequest(tenantId, formValues);
      toast('success', 'Support request created.');
      navigate(`/tenant/help/requests/${created.id}`);
    } catch (cause) {
      toast('error', 'Unable to create support request.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Help & Support"
        description="Find answers, contact management, or raise a support request."
        breadcrumbs={[
          { label: 'Home', href: PATHS.tenant.dashboard },
          { label: 'Help & Support' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(PATHS.tenant.helpRequests)}>
            My support requests
          </Button>
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? undefined} onRetry={reload} /> : null}

      {status === 'success' && data ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader title="FAQ" />
              <FaqAccordion items={faqs} />
            </Card>
            <Card>
              <CardHeader title="Create a support request" />
              <SupportForm values={formValues} errors={formErrors} onChange={setFormValues} />
              <Button className="mt-4" disabled={saving} onClick={() => void submit()}>
                {saving ? 'Submitting…' : 'Submit request'}
              </Button>
            </Card>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Contact management" />
              {data.property ? (
                <>
                  <p className="font-semibold">{data.property.name}</p>
                  <p className="typo-secondary mt-1">Property desk / warden contact</p>
                  <p className="mt-3 text-sm">{formatPhone(data.property.contactNumber)}</p>
                  <p className="typo-secondary">{data.property.email}</p>
                </>
              ) : (
                <p className="typo-secondary">Property contact will appear after your room is assigned.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Emergency information" />
              <p className="typo-helper mb-3">Property-specific demo contacts for StayOps Phase 2. These are not government emergency numbers.</p>
              <ul className="space-y-2 text-sm">
                <li>Property emergency contact: {data.property ? formatPhone(data.property.contactNumber) : 'Assigned after move-in'}</li>
                <li>Security desk: {data.property ? `${data.property.name} security · ${formatPhone(data.property.contactNumber)}` : 'Assigned after move-in'}</li>
                <li>Maintenance desk: {data.property ? `${data.property.name} maintenance · ${data.property.email}` : 'Assigned after move-in'}</li>
              </ul>
              <p className="typo-helper mt-3">For a leaking pipe or broken fixture, raise a complaint instead of a support ticket.</p>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
