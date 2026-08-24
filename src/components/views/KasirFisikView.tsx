import React, { useState } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Search,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { CartItem, Product, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';

interface KasirFisikViewProps {
  products: Product[];
  currentRole: UserRole;
  onOpenNewProduct: () => void;
  onCheckoutPOS: (cart: CartItem[], total: number) => void;
}

export const KasirFisikView: React.FC<KasirFisikViewProps> = ({
  products,
  currentRole,
  onOpenNewProduct,
  onCheckoutPOS,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const categories = ['ALL', 'Pulsa/Paket', 'Listrik', 'Aksesoris', 'Perdana', 'Game'];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Stok barang habis!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Stok hanya tersedia ${product.stock} unit.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          maxStock: product.stock,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.maxStock) {
              alert(`Stok hanya tersisa ${item.maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onCheckoutPOS(cart, cartTotal);
    clearCart();
  };

  return (
    <section id="view-kasir-fisik" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-700" />
            <span>Kasir Penjualan Barang Physical POS</span>
          </h2>
          <p className="text-xs text-slate-500">
            Jual voucher fisik, token pulsa, dan aksesoris HP dengan otomatisasi pencatatan kas
          </p>
        </div>

        {currentRole === 'Admin' && (
          <button
            onClick={onOpenNewProduct}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Katalog Barang */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Search & Category Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari voucher, token, nama aksesoris..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCat === cat
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="posProductGrid">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Tidak ada produk yang cocok</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded">
                          {p.category || 'POS'}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isOutOfStock ? 'text-red-500' : 'text-slate-400'
                          }`}
                        >
                          Stok: {p.stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 mt-1.5 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-sm font-bold text-blue-900 mt-1">
                        {formatRp(p.price)}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                      className={`w-full py-1.5 font-bold text-xs rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-700 border-blue-200 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Habis' : 'Tambah'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Keranjang Belanja POS Checkout */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4 flex flex-col justify-between h-fit sticky top-16">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-700" />
                <span>Keranjang Belanja POS</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 my-2 max-h-72 overflow-y-auto" id="posCartItems">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Keranjang masih kosong</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pilih produk di sebelah kiri</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-slate-800 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRp(item.price)} &times; {item.qty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded-l"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded-r"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 w-20 text-right">
                        {formatRp(item.price * item.qty)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-slate-700">Total Tagihan:</span>
              <span id="posTotal" className="text-blue-900 text-lg">
                {formatRp(cartTotal)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Proses Pembayaran & Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
