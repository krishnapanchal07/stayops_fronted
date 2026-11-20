import type { ComplaintEvent } from '@/types/complaint';
import { formatDateTime } from '@/utils/format';

interface ComplaintTimelineProps {
  events: ComplaintEvent[];
}

export function ComplaintTimeline({ events }: ComplaintTimelineProps) {
  if (events.length === 0) {
    return <p className="typo-secondary">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            {index < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-text">{event.message}</p>
            <p className="typo-helper mt-0.5">
              {formatDateTime(event.createdAt)} · {event.actorName}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
