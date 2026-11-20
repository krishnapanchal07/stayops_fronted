import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS, type StayDocument } from '@/types/document';
import { formatFileSize, formatShortDate } from '@/utils/format';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DocumentCardProps {
  document: StayDocument;
  href: string;
}

export function DocumentCard({ document, href }: DocumentCardProps) {
  return (
    <Link to={href} className="block">
      <Card className="hover:border-primary">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{document.name}</p>
                <p className="typo-helper mt-0.5">{DOCUMENT_CATEGORY_LABELS[document.category]}</p>
              </div>
              <StatusPill value={DOCUMENT_STATUS_LABELS[document.status]} />
            </div>
            <p className="typo-helper mt-2">
              {formatShortDate(document.uploadedAt.slice(0, 10))} · {formatFileSize(document.fileSize)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
