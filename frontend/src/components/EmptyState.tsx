interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="text-lg font-semibold text-ink-900">Nothing here yet</p>
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
    </div>
  );
}
