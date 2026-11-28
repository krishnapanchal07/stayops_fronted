import { Avatar } from '@/components/common/Avatar';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import type { ComplaintComment } from '@/types/complaint';
import { formatDateTime } from '@/utils/format';
import { useId, useState } from 'react';

interface ComplaintCommentsProps {
  comments: ComplaintComment[];
  canComment: boolean;
  submitting: boolean;
  placeholder?: string;
  submitLabel?: string;
  emptyLabel?: string;
  onSubmit: (message: string) => Promise<boolean>;
}

export function ComplaintComments({
  comments,
  canComment,
  submitting,
  placeholder = 'Add a comment…',
  submitLabel = 'Add Comment',
  emptyLabel = 'No comments yet.',
  onSubmit,
}: ComplaintCommentsProps) {
  const [message, setMessage] = useState('');
  const fieldId = useId();

  return (
    <div className="space-y-4">
      {comments.length === 0 ? <p className="typo-secondary">{emptyLabel}</p> : null}
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.authorName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text">{comment.authorName}</p>
                <span className="typo-helper capitalize">{comment.authorRole.toLowerCase()}</span>
                {comment.visibility === 'INTERNAL' ? (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                    Internal
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-text">{comment.message}</p>
              <p className="typo-helper mt-1">{formatDateTime(comment.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
      {canComment ? (
        <div className="space-y-3">
          <Textarea
            label={submitLabel}
            name={fieldId}
            maxLength={3000}
            value={message}
            placeholder={placeholder}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end">
            <Button
              disabled={submitting || !message.trim()}
              onClick={async () => {
                if (await onSubmit(message.trim())) setMessage('');
              }}
            >
              {submitting ? 'Posting…' : submitLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
