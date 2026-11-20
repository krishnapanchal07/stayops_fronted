import { GatePassCard } from '@/components/leave/GatePassCard';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { GatePassStatus, type GatePass } from '@/types/leave';

interface GatePassVerificationProps {
  code: string;
  pass: GatePass | null;
  exitAt?: string | null;
  error?: string;
  verifying: boolean;
  recording: boolean;
  onCodeChange: (value: string) => void;
  onVerify: () => void;
  onRecordExit: () => void;
  onRecordReturn: () => void;
}

export function GatePassVerification({
  code,
  pass,
  exitAt,
  error,
  verifying,
  recording,
  onCodeChange,
  onVerify,
  onRecordExit,
  onRecordReturn,
}: GatePassVerificationProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextInput
          label="Pass Code"
          name="passCode"
          value={code}
          error={error}
          placeholder="GP-2012"
          onChange={(event) => onCodeChange(event.target.value)}
        />
        <Button disabled={verifying || !code.trim()} onClick={onVerify}>
          Verify
        </Button>
      </div>
      {pass ? (
        <div className="space-y-3">
          <GatePassCard pass={pass} exitAt={exitAt} overdue={Boolean(exitAt) && pass.status === 'USED'} />
          <div className="flex flex-wrap gap-2">
            {pass.status === GatePassStatus.ACTIVE ? (
              <Button disabled={recording} onClick={onRecordExit}>
                Record Exit
              </Button>
            ) : null}
            {pass.status === GatePassStatus.USED ? (
              <Button disabled={recording} onClick={onRecordReturn}>
                Record Return
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
