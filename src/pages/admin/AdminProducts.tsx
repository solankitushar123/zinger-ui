import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, Loader2, Package } from 'lucide-react'
import { productAPI, categoryAPI } from '../../api'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', discountPercent: '0', category: '', stock: '', unit: 'piece', weight: '', brand: '', isFeatured: false, isTrending: false, tags: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-products', search], queryFn: () => productAPI.getAll({ search, limit: 50 }).then(r => r.data) })
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then(r => r.data.categories) })

  const createMutation = useMutation({
    mutationFn: () => productAPI.update(editing._id, { ...form, price: Number(form.price), stock: Number(form.stock), discountPercent: Number(form.discountPercent), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setShowForm(false); setEditing(null); toast.success('Product updated!') }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted') }
  })

  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, description: p.description, price: String(p.price), discountPercent: String(p.discountPercent), category: (p.category?._id || p.category), stock: String(p.stock), unit: p.unit, weight: p.weight||'', brand: p.brand||'', isFeatured: p.isFeatured, isTrending: p.isTrending, tags: p.tags?.join(', ')||'' }); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 input" />
      </div>

      {/* Edit form */}
      {showForm && editing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Edit: {editing.name}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input text-sm col-span-2" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <textarea className="input text-sm col-span-2 resize-none" rows={2} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <input className="input text-sm" type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            <input className="input text-sm" type="number" placeholder="Discount %" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} />
            <select className="input text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Select Category</option>
              {catData?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input className="input text-sm" type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
            <input className="input text-sm" placeholder="Brand" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
            <input className="input text-sm" placeholder="Weight (e.g. 500g)" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            <input className="input text-sm col-span-2" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isTrending} onChange={e => setForm({...form, isTrending: e.target.checked})} /> Trending</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Save
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8"><Loader2 size={24} className="animate-spin text-primary-600 mx-auto" /></td></tr>
              ) : data?.products?.map((p: any) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                      <div>
                        <p className="font-medium text-gray-800 max-w-[160px] truncate">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">₹{p.discountedPrice || p.price}</span>
                    {p.discountPercent > 0 && <span className="text-xs text-green-600 ml-1">({p.discountPercent}%off)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-orange-500' : 'text-green-600'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.isFeatured && <span className="badge bg-blue-100 text-blue-700 text-[10px]">Featured</span>}
                      {p.isTrending && <span className="badge bg-orange-100 text-orange-700 text-[10px]">Trending</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p._id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
