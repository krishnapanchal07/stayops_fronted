import { Avatar } from '@/components/common/Avatar';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { NotificationPreferencesForm } from '@/components/profile/NotificationPreferencesForm';
import { TextInput } from '@/components/forms/TextInput';
import { TenantProfileImageField } from '@/components/tenants/TenantProfileImageField';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { getHomePath } from '@/routes/paths';
import { profileService } from '@/services/profile/profileService';
import { propertyService } from '@/services/property/propertyService';
import { sessionApplied } from '@/store/slices/authSlice';
import type { ChangePasswordValues, NotificationPreferences } from '@/types/support';
import { validateChangePassword, type ChangePasswordErrors } from '@/utils/supportValidation';
import { useCallback, useState } from 'react';

const emptyPassword: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function StaffProfilePage() {
  const user = useCurrentUser();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const userId = user?.id ?? '';

  const loader = useCallback(async () => {
    if (!userId) throw new Error('Profile information unavailable.');
    const [preferences, properties] = await Promise.all([
      profileService.getNotificationPreferences(userId),
      propertyService.getProperties(),
    ]);
    const assignedNames = (user?.propertyIds ?? [])
      .map((id) => properties.find((property) => property.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return { preferences, assignedNames };
  }, [user?.propertyIds, userId]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [nameError, setNameError] = useState<string | undefined>();
  const [passwordValues, setPasswordValues] = useState(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({});
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const displayName = name || user?.name || '';
  const prefs = preferences ?? data?.preferences ?? null;

  const saveProfile = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name is required.');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Use at least 2 characters.');
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      const session = await profileService.updateMyProfile(user.id, {
        name: trimmed,
        avatar: avatar || undefined,
      });
      dispatch(sessionApplied(session));
      setName(session.user.name);
      setAvatar(session.user.avatar ?? '');
      toast('success', 'Profile updated successfully.');
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

  if (!user) {
    return (
      <div>
        <PageHeader title="My Profile" breadcrumbs={[{ label: 'Home' }, { label: 'My Profile' }]} />
        <ErrorState title="Profile information unavailable." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your account details, photo and notification settings."
        breadcrumbs={[{ label: 'Home', href: getHomePath(user.role) }, { label: 'My Profile' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Profile information unavailable." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data && prefs ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={avatar || user.avatar} name={displayName} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-text">{displayName}</h2>
                  <p className="typo-helper mt-1">{user.roleLabel}</p>
                  <div className="mt-2">
                    <StatusPill value={user.status} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Account details" />
              <div className="space-y-4">
                <TenantProfileImageField name={displayName} value={avatar} onChange={setAvatar} />
                <TextInput
                  label="Display name"
                  name="name"
                  value={name}
                  error={nameError}
                  required
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError(undefined);
                  }}
                />
                <TextInput
                  label="Email"
                  name="email"
                  value={user.email}
                  readOnly
                  helperText="Email is used to sign in and cannot be changed here."
                />
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
              <CardHeader title="Role & assignment" />
              <dl className="space-y-3 text-sm">
                <ReadOnly label="User ID" value={user.id} />
                <ReadOnly label="Role" value={user.roleLabel} />
                <ReadOnly
                  label="Assigned properties"
                  value={data.assignedNames.length > 0 ? data.assignedNames.join(', ') : 'Not assigned'}
                />
                <div>
                  <dt className="typo-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusPill value={user.status} />
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
