export type BucketStatus = 'inbox' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'backburner';

export const BUCKETS: { id: BucketStatus; label: string }[] = [
  { id: 'today', label: 'today' },
  { id: 'tomorrow', label: 'tomorrow' },
  { id: 'this_week', label: 'this week' },
  { id: 'next_week', label: 'next week' },
  { id: 'backburner', label: 'backburner' },
];

export function getBucketLabel(status: string): string {
  const bucket = BUCKETS.find(b => b.id === status);
  return bucket?.label || status;
}
