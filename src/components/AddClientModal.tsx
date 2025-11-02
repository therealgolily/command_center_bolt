import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Client } from '../lib/supabase';

type AddClientModalProps = {
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
};

export function AddClientModal({ onClose, onSave }: AddClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [nextExpectedPaymentDate, setNextExpectedPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      payment_method: paymentMethod || null,
      monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
      last_payment_date: lastPaymentDate || null,
      next_expected_payment_date: nextExpectedPaymentDate || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] sticky top-0 bg-white">
          <h3 className="font-semibold text-[#1e293b]">add client</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-[#1e293b] rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1e293b] mb-1">
              client name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              ref={nameRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1e293b] mb-1">
                email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#1e293b] mb-1">
                phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium text-[#1e293b] mb-1">
                payment method
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              >
                <option value="">select method</option>
                <option value="check">check</option>
                <option value="quickbooks">quickbooks</option>
                <option value="stripe">stripe</option>
                <option value="direct_deposit">direct deposit</option>
              </select>
            </div>

            <div>
              <label htmlFor="monthly-rate" className="block text-sm font-medium text-[#1e293b] mb-1">
                monthly rate
              </label>
              <input
                id="monthly-rate"
                type="number"
                step="0.01"
                min="0"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="last-payment" className="block text-sm font-medium text-[#1e293b] mb-1">
                last payment date
              </label>
              <input
                id="last-payment"
                type="date"
                value={lastPaymentDate}
                onChange={(e) => setLastPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="next-payment" className="block text-sm font-medium text-[#1e293b] mb-1">
                next expected payment
              </label>
              <input
                id="next-payment"
                type="date"
                value={nextExpectedPaymentDate}
                onChange={(e) => setNextExpectedPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[#1e293b] mb-1">
              notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none"
              placeholder="any notes about this client..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              add client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
