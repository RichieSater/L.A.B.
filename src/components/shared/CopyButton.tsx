import { useClipboard } from '../../hooks/use-clipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy to Clipboard', className = '' }: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        copied
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${className}`}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
