import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const open = item.id === openId;
        return (
          <li key={item.id} className="rounded-2xl border border-border bg-surface">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="font-medium text-text">{item.question}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
            </button>
            {open ? <p className="px-4 pb-4 text-sm text-muted">{item.answer}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
