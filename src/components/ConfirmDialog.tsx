import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle size={20} className="text-[#ef4444]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#1e293b] mb-1">{title}</h3>
            <p className="text-sm text-[#64748b]">{message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#ef4444] text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
