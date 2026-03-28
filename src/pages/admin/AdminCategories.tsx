import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react'
import { categoryAPI, couponAPI } from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function AdminCategories() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '', color: '#00b14f', sortOrder: '0' })

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then(r => r.data.categories) })
  const createMutation = useMutation({
    mutationFn: () => { const fd = new FormData(); Object.entries(form).forEach(([k,v]) => fd.append(k, v)); return categoryAPI.create(fd) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setShowForm(false); setForm({ name: '', icon: '', color: '#00b14f', sortOrder: '0' }); toast.success('Category created!') }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted') }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Category</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">New Category</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input text-sm" placeholder="Category Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="input text-sm" placeholder="Icon emoji (e.g. 🥦)" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} />
            <div className="flex items-center gap-2"><label className="text-sm text-gray-600">Color:</label><input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-9 w-14 rounded-lg border border-gray-200" /></div>
            <input className="input text-sm" type="number" placeholder="Sort Order" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: e.target.value})} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="btn-primary flex items-center gap-2">{createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading ? <div className="col-span-full text-center py-8"><Loader2 size={24} className="animate-spin text-primary-600 mx-auto" /></div>
          : data?.map((cat: any) => (
            <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 p-4 relative group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: cat.color + '20' }}>{cat.icon || '🛒'}</div>
              <p className="font-semibold text-sm text-gray-800">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Order: {cat.sortOrder}</p>
              <button onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(cat._id) }}
                className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}

export function AdminCoupons() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0', expiryDate: '', description: '', maxDiscount: '', totalUsageLimit: '' })

  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => couponAPI.getAll().then(r => r.data.coupons) })
  const createMutation = useMutation({
    mutationFn: () => couponAPI.create({ ...form, discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : undefined } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setShowForm(false); toast.success('Coupon created!') }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Coupon deleted') }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Coupon</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">New Coupon</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input text-sm uppercase" placeholder="Coupon Code *" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
            <select className="input text-sm" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input className="input text-sm" type="number" placeholder="Discount Value *" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} />
            <input className="input text-sm" type="number" placeholder="Min Order Amount" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} />
            {form.discountType === 'percentage' && <input className="input text-sm" type="number" placeholder="Max Discount (₹)" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} />}
            <input className="input text-sm" type="number" placeholder="Total Usage Limit" value={form.totalUsageLimit} onChange={e => setForm({...form, totalUsageLimit: e.target.value})} />
            <input className="input text-sm col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="col-span-2"><label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date *</label><input className="input text-sm" type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate()} disabled={!form.code || !form.discountValue || !form.expiryDate || createMutation.isPending} className="btn-primary flex items-center gap-2">{createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-left text-xs text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Min Order</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={7} className="text-center py-8"><Loader2 size={24} className="animate-spin text-primary-600 mx-auto" /></td></tr>
              : data?.map((c: any) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-primary-600">{c.code}</td>
                  <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}</td>
                  <td className="px-4 py-3">₹{c.minOrderAmount}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(c.expiryDate), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">{c.usedCount}{c.totalUsageLimit ? `/${c.totalUsageLimit}` : ''}</td>
                  <td className="px-4 py-3"><span className={`badge text-xs ${c.isActive && new Date(c.expiryDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive && new Date(c.expiryDate) > new Date() ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3"><button onClick={() => { if (confirm('Delete coupon?')) deleteMutation.mutate(c._id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminBanners() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-gray-900">Banners</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Banner management — upload images via the API or Cloudinary dashboard.</p>
        <p className="text-sm text-gray-400 mt-2">POST /api/banners with multipart/form-data including an image file.</p>
      </div>
    </div>
  )
}

export default AdminCategories
