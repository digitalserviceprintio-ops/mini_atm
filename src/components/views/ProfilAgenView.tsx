import React, { useState } from 'react';
import {
  Store,
  Upload,
  Save,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AgentProfile } from '../../types';
import { INITIAL_AGENT_PROFILE } from '../../data/initialData';

interface ProfilAgenViewProps {
  profile: AgentProfile;
  onSaveProfile: (profile: AgentProfile) => void;
}

export const ProfilAgenView: React.FC<ProfilAgenViewProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<AgentProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const initials = formData.ownerName
    ? formData.ownerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CS';

  const handleInputChange = (field: keyof AgentProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (PNG/JPG/WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan data profil agen ke pengaturan awal?')) {
      setFormData(INITIAL_AGENT_PROFILE);
      onSaveProfile(INITIAL_AGENT_PROFILE);
    }
  };

  return (
    <section id="view-profil-agen" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-700" />
            <span>Pengaturan Profil Agen & Format Struk</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola identitas outlet, logo struk, nomor kontak, serta kustomisasi pesan thermal printer
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Profil */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Top Logo / Avatar Picker */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl border border-blue-200 overflow-hidden shadow-xs shrink-0">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    className="w-full h-full object-cover"
                    alt="Logo Profil"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800">{formData.storeName}</h3>
                <p className="text-[11px] text-slate-500">{formData.ownerName} (Owner Agen)</p>

                <div className="flex items-center gap-2 pt-1">
                  <label
                    htmlFor="profLogoInput"
                    className="cursor-pointer px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-200 flex items-center gap-1 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Struk</span>
                  </label>
                  <input
                    type="file"
                    id="profLogoInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Nama Toko / Outlet Agen</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Nama Pemilik / Agen</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">ID Agen Link / Mini ATM</label>
                <input
                  type="text"
                  required
                  value={formData.idAgent}
                  onChange={(e) => handleInputChange('idAgent', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Alamat Lengkap Outlet / Toko</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Struk Thermal Customization Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Kustomisasi Format Struk Thermal</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Sub-Header Struk</label>
                  <input
                    type="text"
                    value={formData.receiptHeader}
                    onChange={(e) => handleInputChange('receiptHeader', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Lebar Kertas Struk Printer</label>
                  <select
                    value={formData.paperWidth}
                    onChange={(e) =>
                      handleInputChange('paperWidth', e.target.value as '58mm' | '80mm')
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="58mm">58mm (Standar Mini Thermal Bluetooth)</option>
                    <option value="80mm">80mm (Thermal POS Desktop Lebar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Pesan Footer Struk</label>
                <textarea
                  rows={2}
                  value={formData.receiptFooter}
                  onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profil & Struk berhasil disimpan!</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Perubahan akan langsung diterapkan ke struk cetak
                </span>
              )}

              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil Agen</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card Struk */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pratinjau Struk Cetak ({formData.paperWidth})
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              Live Preview
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs font-mono text-xs space-y-3 select-none">
            <div className="text-center border-b border-slate-200 pb-3 space-y-1">
              {formData.logoUrl && (
                <div className="w-10 h-10 mx-auto rounded-md overflow-hidden mb-1 border border-slate-200">
                  <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo Preview" />
                </div>
              )}
              <h4 className="font-bold text-sm text-slate-900 leading-tight">
                {formData.storeName || 'MINI ATM AGENT'}
              </h4>
              <p className="text-[10px] text-slate-600 font-sans">
                {formData.receiptHeader || 'BRILink & Multi Payment'}
              </p>
              {formData.address && (
                <p className="text-[9px] text-slate-400 font-sans">{formData.address}</p>
              )}
              <p className="text-[9px] text-slate-500 pt-1">Telp: {formData.phone}</p>
            </div>

            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>ID Trx:</span>
                <span className="font-bold">#TRX-101</span>
              </div>
              <div className="flex justify-between">
                <span>ID Agen:</span>
                <span>{formData.idAgent}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe:</span>
                <span className="font-bold">SETOR TUNAI</span>
              </div>
              <div className="flex justify-between">
                <span>Pengirim:</span>
                <span>Mbak Dewi</span>
              </div>
              <div className="flex justify-between">
                <span>Tujuan:</span>
                <span>Bu Painem</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span>Rp 200.000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan:</span>
                <span>Rp 4.000</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-blue-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>Rp 204.000</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 whitespace-pre-line font-sans">
              {formData.receiptFooter}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
