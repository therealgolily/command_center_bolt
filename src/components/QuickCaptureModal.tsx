import { useEffect } from 'react';
import { X } from 'lucide-react';
import { QuickCaptureForm } from './QuickCaptureForm';

type QuickCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => void;
};

export function QuickCaptureModal({ isOpen, onClose, onSubmit }: QuickCaptureModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[#1e293b]">quick capture</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-[#1e293b] rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <QuickCaptureForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
