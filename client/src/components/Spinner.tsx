interface Props {
  message?: string;
}

export default function Spinner({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-500">
      <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
