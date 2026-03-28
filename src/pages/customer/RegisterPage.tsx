import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const { register, isRegistering } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register(form, { onSuccess: () => navigate('/') })
  }

  const perks = ['10-minute delivery', 'Exclusive app deals', 'Track orders live', 'Easy returns']

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-green">
              <span className="text-white font-display font-black text-4xl leading-none">Z</span>
            </div>
            <span className="font-display font-black text-2xl text-gray-900">ZINGER</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-card-md border border-gray-100 p-7">
          <h2 className="font-display font-black text-2xl text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-400 text-sm mb-4">Get groceries delivered in 10 minutes</p>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-1.5 mb-5">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle size={12} className="text-primary-500 flex-shrink-0" /> {p}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="Rahul Sharma" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mobile Number <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input" placeholder="10-digit mobile number" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required minLength={6}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pr-11" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isRegistering}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-1">
              {isRegistering
                ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                : <>Create Account <ArrowRight size={17} /></>
              }
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">Terms</Link> &{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          </p>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">Already have an account?</span>
            </div>
          </div>

          <Link to="/login"
            className="w-full flex items-center justify-center py-3 border-2 border-gray-200 hover:border-primary-300 text-gray-700 font-semibold rounded-2xl transition-all text-sm">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
