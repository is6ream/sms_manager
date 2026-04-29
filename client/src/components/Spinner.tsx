interface Props {
  message?: string;
}

export default function Spinner({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
      <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
