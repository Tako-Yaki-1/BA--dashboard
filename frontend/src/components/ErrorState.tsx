interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <p className="text-lg font-semibold text-negative-600">Could not load data</p>
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500"
      >
        Try again
      </button>
    </div>
  );
}
