import { X, Command } from 'lucide-react';

type ShortcutsModalProps = {
  onClose: () => void;
};

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      section: 'General',
      items: [
        { keys: [`${modKey}`, 'K'], description: 'Quick capture (create new task)' },
        { keys: ['?'], description: 'Show this shortcuts menu' },
        { keys: ['Esc'], description: 'Close modal/cancel action' },
      ],
    },
    {
      section: 'Navigation',
      items: [
        { keys: ['G', 'P'], description: 'Go to Planning' },
        { keys: ['G', 'C'], description: 'Go to Calendar' },
        { keys: ['G', 'L'], description: 'Go to Clients' },
        { keys: ['G', 'M'], description: 'Go to Money' },
        { keys: ['G', 'I'], description: 'Go to Inbox' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Command size={24} className="text-[#3b82f6]" />
            <h2 className="text-xl font-semibold text-[#1e293b]">keyboard shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-[#64748b]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-8">
            {shortcuts.map((section) => (
              <div key={section.section}>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-3">
                  {section.section}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                    >
                      <span className="text-[#1e293b]">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIdx) => (
                          <div key={keyIdx} className="flex items-center gap-1">
                            {keyIdx > 0 && (
                              <span className="text-[#94a3b8] text-sm">then</span>
                            )}
                            <kbd className="px-2 py-1 bg-white border border-[#e2e8f0] rounded text-sm font-mono text-[#1e293b] shadow-sm min-w-[2rem] text-center">
                              {key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] bg-gray-50">
          <p className="text-sm text-[#64748b] text-center">
            Press <kbd className="px-2 py-0.5 bg-white border border-[#e2e8f0] rounded text-xs font-mono">?</kbd> to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
}
