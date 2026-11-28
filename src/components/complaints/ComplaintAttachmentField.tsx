import { Button } from '@/components/ui/Button';
import type { ComplaintAttachment } from '@/types/complaint';
import { addComplaintAttachments, isPreviewableImage, removeComplaintAttachment } from '@/utils/complaintAttachments';
import { formatFileSize } from '@/utils/format';
import { Paperclip, X } from 'lucide-react';
import { useRef } from 'react';

interface ComplaintAttachmentFieldProps {
  attachments: ComplaintAttachment[];
  uploadedBy: string;
  onChange: (attachments: ComplaintAttachment[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function ComplaintAttachmentField({
  attachments,
  uploadedBy,
  onChange,
  onError,
  disabled,
}: ComplaintAttachmentFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text">Attachments</p>
      <button
        type="button"
        disabled={disabled}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center disabled:cursor-not-allowed"
        onClick={() => fileInput.current?.click()}
      >
        <Paperclip className="mb-2 h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-text">Add images</span>
        <span className="typo-helper mt-1">Up to four JPG, PNG or WebP images, each under 4 MiB</span>
      </button>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={disabled}
        onChange={(event) => {
          const files = event.target.files;
          if (!files?.length) return;
          const result = addComplaintAttachments(attachments, files, uploadedBy);
          if (result.errors.length > 0) onError?.(result.errors[0] ?? 'Unable to add file.');
          onChange(result.attachments);
          event.target.value = '';
        }}
      />

      {attachments.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
              {isPreviewableImage(file.fileType) && file.previewUrl ? (
                <img src={file.previewUrl} alt={file.fileName} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                  FILE
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{file.fileName}</p>
                <p className="typo-helper">{formatFileSize(file.fileSize)}</p>
              </div>
              {!disabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${file.fileName}`}
                  onClick={() => onChange(removeComplaintAttachment(attachments, file.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
