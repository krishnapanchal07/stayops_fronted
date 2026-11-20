import { Avatar } from '@/components/common/Avatar';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { NotificationPreferencesForm } from '@/components/profile/NotificationPreferencesForm';
import { TenantProfileForm } from '@/components/profile/TenantProfileForm';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { profileService } from '@/services/profile/profileService';
import { tenantService } from '@/services/tenant/tenantService';
import { TENANT_STATUS_LABELS } from '@/types/tenant';
import type { ChangePasswordValues, NotificationPreferences, TenantProfileFormValues } from '@/types/support';
import { formatINR, formatShortDate } from '@/utils/format';
import {
  toTenantProfileForm,
  validateChangePassword,
  validateTenantProfileForm,
  type ChangePasswordErrors,
  type TenantProfileFormErrors,
} from '@/utils/supportValidation';
import { useCallback, useState } from 'react';

const emptyPassword: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function TenantProfilePage() {
  const user = useCurrentUser();
  const toast = useToast();
  const tenantId = user?.id ?? '';

  const loader = useCallback(async () => {
    if (!tenantId) throw new Error('Profile information unavailable.');
    const [tenant, preferences] = await Promise.all([
      tenantService.getTenantById(tenantId),
      profileService.getNotificationPreferences(tenantId),
    ]);
    return { tenant, preferences };
  }, [tenantId]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const [formValues, setFormValues] = useState<TenantProfileFormValues | null>(null);
  const [formErrors, setFormErrors] = useState<TenantProfileFormErrors>({});
  const [passwordValues, setPasswordValues] = useState(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({});
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const values = formValues ?? (data ? toTenantProfileForm(data.tenant) : null);
  const prefs = preferences ?? data?.preferences ?? null;

  const saveProfile = async () => {
    if (!values || !tenantId) return;
    const errors = validateTenantProfileForm(values);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await tenantService.updateMyProfile(tenantId, values);
      toast('success', values.profileImage ? 'Profile photo updated.' : 'Profile updated successfully.');
      reload();
    } catch (cause) {
      toast('error', 'Unable to update profile.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!user) return;
    const errors = validateChangePassword(passwordValues);
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setPasswordSaving(true);
    try {
      await profileService.changePassword(user.id, passwordValues.currentPassword, passwordValues.newPassword);
      setPasswordValues(emptyPassword);
      toast('success', 'Password updated.');
    } catch (cause) {
      toast('error', 'Unable to change password.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setPasswordSaving(false);
    }
  };

  const savePrefs = async (next: NotificationPreferences) => {
    setPreferences(next);
    await profileService.saveNotificationPreferences(next);
    toast('success', 'Notification preferences saved.');
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your personal details, stay information and account settings."
        breadcrumbs={[
          { label: 'Home', href: PATHS.tenant.dashboard },
          { label: 'My Profile' },
        ]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Profile information unavailable." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data && values && prefs ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={values.profileImage || data.tenant.profileImage} name={data.tenant.fullName} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-text">{data.tenant.fullName}</h2>
                  <p className="typo-helper mt-1">{data.tenant.tenantCode}</p>
                  <div className="mt-2">
                    <StatusPill value={TENANT_STATUS_LABELS[data.tenant.status]} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Personal information" />
              <TenantProfileForm
                values={values}
                errors={formErrors}
                displayName={data.tenant.fullName}
                onChange={setFormValues}
              />
              <div className="mt-5">
                <TextInput label="Email" name="email" value={data.tenant.email} readOnly helperText="Email is used to sign in and cannot be changed here." />
              </div>
              <Button className="mt-5" disabled={saving} onClick={() => void saveProfile()}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </Card>

            <Card>
              <CardHeader title="Change password" />
              <ChangePasswordForm
                values={passwordValues}
                errors={passwordErrors}
                saving={passwordSaving}
                onChange={setPasswordValues}
                onSubmit={() => void savePassword()}
              />
            </Card>

            <Card>
              <CardHeader title="Notification preferences" />
              <NotificationPreferencesForm values={prefs} onChange={(next) => void savePrefs(next)} />
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Current stay" />
              <dl className="space-y-3 text-sm">
                <ReadOnly label="Tenant ID" value={data.tenant.tenantCode} />
                <ReadOnly label="Property" value={data.tenant.propertyName ?? 'Not assigned'} />
                <ReadOnly label="Building" value={data.tenant.buildingName ?? '—'} />
                <ReadOnly label="Floor" value={data.tenant.floorName ?? '—'} />
                <ReadOnly label="Room" value={data.tenant.roomNumber ?? 'Not assigned'} />
                <ReadOnly label="Bed" value={data.tenant.bedLabel ?? '—'} />
                <ReadOnly label="Monthly rent" value={formatINR(data.tenant.roomRent ?? 0)} />
                <ReadOnly label="Security deposit" value={formatINR(data.tenant.securityDeposit ?? 0)} />
                <ReadOnly label="Move-in date" value={formatShortDate(data.tenant.moveInDate)} />
                <div>
                  <dt className="typo-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusPill value={TENANT_STATUS_LABELS[data.tenant.status]} />
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 font-medium text-text">{value}</dd>
    </div>
  );
}
