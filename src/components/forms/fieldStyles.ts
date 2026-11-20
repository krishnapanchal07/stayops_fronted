export const fieldControlClass =
  'h-11 w-full rounded-xl border bg-input px-3 text-sm text-text placeholder:text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export function fieldBorderClass(error?: string): string {
  return error ? 'border-danger' : 'border-border focus:border-primary';
}
