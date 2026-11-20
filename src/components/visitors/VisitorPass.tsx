import { Button } from '@/components/ui/Button';
import { VisitorStatus, type Visitor, type VisitorPass as VisitorPassModel } from '@/types/visitor';
import { formatShortDate, formatTime } from '@/utils/format';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface VisitorPassProps {
  visitor: Visitor;
  pass?: VisitorPassModel | null;
}

export function VisitorPass({ visitor, pass }: VisitorPassProps) {
  const token = pass?.token ?? visitor.qrToken;
  const expiresAt = pass?.expiresAt ?? visitor.qrExpiresAt;
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    QRCode.toDataURL(token, { width: 220, margin: 1, color: { dark: '#0F182E', light: '#FFFFFF' } })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token || visitor.status === VisitorStatus.REJECTED || visitor.status === VisitorStatus.CANCELLED) {
    return null;
  }

  const printPass = () => {
    window.print();
  };

  const downloadPass = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${visitor.visitorCode}-pass.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-surface p-5 text-center shadow-sm print:border print:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">StayOps</p>
        <h3 className="mt-1 text-lg font-semibold text-text">Visitor Pass</h3>
        <p className="typo-helper mt-1">{visitor.visitorCode}</p>
        {qrUrl ? (
          <img src={qrUrl} alt={`Visitor pass ${visitor.visitorCode}`} className="mx-auto mt-4 h-44 w-44" />
        ) : (
          <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-xl bg-background text-sm text-muted">
            {token}
          </div>
        )}
        <dl className="mt-4 space-y-1 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Visitor</dt>
            <dd className="font-medium text-text">{visitor.visitorName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Host</dt>
            <dd className="font-medium text-text">{visitor.tenantName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Property</dt>
            <dd className="font-medium text-text">{visitor.propertyName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Visit</dt>
            <dd className="font-medium text-text">{formatShortDate(visitor.visitDate)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Entry</dt>
            <dd className="font-medium text-text">{formatTime(visitor.expectedEntryTime)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Valid until</dt>
            <dd className="font-medium text-text">{expiresAt ? formatTime(expiresAt) : formatTime(visitor.expectedExitTime)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Status</dt>
            <dd className="font-semibold text-primary">{visitor.status}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button variant="outline" onClick={printPass}>
          Print
        </Button>
        <Button variant="outline" onClick={downloadPass} disabled={!qrUrl}>
          Download
        </Button>
      </div>
    </div>
  );
}
