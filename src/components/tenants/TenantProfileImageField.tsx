import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/common/Avatar';
import { useToast } from '@/hooks/useToast';
import { createTenantProfilePreview, revokeTenantProfilePreview, validateTenantProfileImage } from '@/utils/tenantImages';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef } from 'react';

interface TenantProfileImageFieldProps {
  name: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function TenantProfileImageField({ name, value, onChange, disabled = false }: TenantProfileImageFieldProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const error = validateTenantProfileImage(file);
    if (error) {
      toast('error', 'Unable to use this image.', error);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    revokeTenantProfilePreview(value);
    onChange(createTenantProfilePreview(file));
    toast('success', 'Profile image added.');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar src={value || undefined} name={name || 'Tenant'} size="lg" />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<ImagePlus className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Add Photo
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              revokeTenantProfilePreview(value);
              onChange('');
            }}
            disabled={disabled}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        aria-label="Add tenant profile photo"
        onChange={(event) => handleFile(event.target.files)}
      />
    </div>
  );
}
