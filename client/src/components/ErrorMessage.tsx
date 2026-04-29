interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return (
    <div className="rounded-md bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-sm">
      {message}
    </div>
  );
}
