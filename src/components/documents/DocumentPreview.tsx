import { EmptyState } from '@/components/feedback/EmptyState';
import type { StayDocument } from '@/types/document';
import { FileText } from 'lucide-react';

interface DocumentPreviewProps {
  document: StayDocument;
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  if (document.previewUrl && document.fileType.startsWith('image/')) {
    return (
      <img
        src={document.previewUrl}
        alt={document.name}
        className="max-h-[420px] w-full rounded-2xl object-contain bg-background"
      />
    );
  }

  return (
    <EmptyState
      icon={<FileText className="h-8 w-8" />}
      title="Preview unavailable"
      description="This Phase 2 mock file has metadata only. Use Download for a demo text copy, or open the linked receipt if this is a finance document."
    />
  );
}
