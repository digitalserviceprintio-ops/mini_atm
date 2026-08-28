import React, { useState, useEffect } from 'react';
import { UserCheck, X, Sparkles, Phone, Mail, MapPin, Award, FileText, Check } from 'lucide-react';
import { CustomerMember, MemberTier } from '../../types';

interface ModalMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Partial<CustomerMember>) => void;
  editingMember: CustomerMember | null;
  existingMembersCount?: number;
}

export const ModalMemberForm: React.FC<ModalMemberFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
  existingMembersCount = 0,
}) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [tier, setTier] = useState<MemberTier>('Silver');
  const [points, setPoints] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [notes, setNotes] = useState<string>('');
  const [memberNumber, setMemberNumber] = useState<string>('');

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setPhone(editingMember.phone);
      setEmail(editingMember.email || '');
      setAddress(editingMember.address || '');
      setTier(editingMember.tier);
      setPoints(editingMember.points);
      setStatus(editingMember.status);
      setNotes(editingMember.notes || '');
      setMemberNumber(editingMember.memberNumber);
    } else {
      // Auto-generate realistic 16-digit card number
      const count = typeof existingMembersCount === 'number' ? existingMembersCount : 0;
      const seq = String(count + 1).padStart(4, '0');
      const randomBlock = Math.floor(1000 + Math.random() * 9000);
      const generatedCardNo = `8820 1001 ${randomBlock} ${seq}`;
      
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTier('Silver');
      setPoints(0);
      setStatus('ACTIVE');
      setNotes('');
      setMemberNumber(generatedCardNo);
    }
  }, [editingMember, isOpen, existingMembersCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama pelanggan wajib diisi!');
      return;
    }
    if (!phone.trim()) {
      alert('Nomor HP/WhatsApp pelanggan wajib diisi!');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    onSave({
      id: editingMember ? editingMember.id : undefined,
      memberNumber,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      tier,
      points: Number(points) || 0,
      status,
      notes: notes.trim() || undefined,
      joinDate: editingMember ? editingMember.joinDate : todayStr,
      barcode: editingMember ? editingMember.barcode : `MBR${String(existingMembersCount + 1).padStart(4, '0')}`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-700/70 rounded-xl shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {editingMember ? 'Edit Data Member Pelanggan' : 'Registrasi Member Baru (+1 Poin/Trx)'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {editingMember ? `ID: ${editingMember.id}` : 'Daftarkan pelanggan setia untuk program reward poin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Card Number Preview */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-3 rounded-xl border border-slate-800 text-white space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="uppercase font-semibold tracking-wider flex items-center gap-1 text-amber-300">
                <Sparkles className="w-3 h-3 text-amber-400" /> Nomor Kartu Member (Otomatis)
              </span>
              <span className="font-mono bg-blue-900 px-1.5 py-0.5 rounded text-blue-200">
                CR-80 Chip
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-amber-200 tracking-wider">
              {memberNumber}
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Mbak Dewi Sartika"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor HP / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelanggan@email.com"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tingkatan / Tier Member
              </label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as MemberTier)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="Silver">Silver (Member Reguler)</option>
                  <option value="Gold">Gold (Member Prioritas)</option>
                  <option value="Platinum">Platinum (Member Utama)</option>
                  <option value="VIP">VIP (Member Eksekutif)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Points & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Saldo Poin Reward Awal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono font-bold text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-500">Poin</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                +1 Poin otomatis bertambah tiap transaksi
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Status Keanggotaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="ACTIVE">AKTIF (Dapat Poin & Reward)</option>
                <option value="INACTIVE">NON-AKTIF (Ditangguhkan)</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Alamat Domisili (Opsional)
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Merpati No. 10, RT 01/RW 02"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Catatan Khusus Pelanggan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Langganan bayar angsuran motor & tagihan listrik"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{editingMember ? 'Simpan Perubahan' : 'Daftarkan Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
