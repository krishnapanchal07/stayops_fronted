import { Avatar } from '@/components/common/Avatar';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import type { SupportComment } from '@/types/support';
import { formatDateTime } from '@/utils/format';
import { useState } from 'react';

interface SupportTimelineProps {
  comments: SupportComment[];
  canComment: boolean;
  submitting: boolean;
  onSubmit: (message: string) => void;
}

export function SupportTimeline({ comments, canComment, submitting, onSubmit }: SupportTimelineProps) {
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      {comments.length === 0 ? <p className="typo-secondary">No comments yet.</p> : null}
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.authorName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text">{comment.authorName}</p>
                <span className="typo-helper capitalize">{comment.authorRole.toLowerCase()}</span>
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
            label="Add a comment"
            name="supportComment"
            value={message}
            placeholder="Share an update…"
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end">
            <Button
              disabled={submitting || !message.trim()}
              onClick={() => {
                onSubmit(message.trim());
                setMessage('');
              }}
            >
              {submitting ? 'Posting…' : 'Add Comment'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="typo-helper">Comments are closed on this request.</p>
      )}
    </div>
  );
}
