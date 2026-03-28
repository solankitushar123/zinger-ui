import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Phone, Mail, Camera, Loader2, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' })

  const updateMutation = useMutation({
    mutationFn: () => authAPI.updateProfile(form),
    onSuccess: (res) => { updateUser(res.data.user); toast.success('Profile updated!') }
  })
  const passMutation = useMutation({
    mutationFn: () => authAPI.changePassword(passForm),
    onSuccess: () => { toast.success('Password changed!'); setPassForm({ currentPassword: '', newPassword: '' }) }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User size={24} className="text-primary-600" /> My Profile
      </h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <div className="relative">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-display font-bold text-primary-600">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display font-bold text-gray-900 text-lg">{user?.name}</h2>
          <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5"><Mail size={13} />{user?.email}</p>
          {user?.phone && <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5"><Phone size={13} />{user?.phone}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="badge bg-primary-100 text-primary-700 capitalize">{user?.role}</span>
            {user?.isEmailVerified && <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><Shield size={10} /> Verified</span>}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-display font-bold text-gray-800 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="10-digit number" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
            {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null} Save Changes
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-display font-bold text-gray-800 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
            <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
            <input type="password" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} className="input" placeholder="Min 6 characters" />
          </div>
          <button onClick={() => passMutation.mutate()} disabled={passMutation.isPending || !passForm.currentPassword || !passForm.newPassword} className="btn-primary flex items-center gap-2">
            {passMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null} Update Password
          </button>
        </div>
      </div>
    </div>
  )
}
