import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight, Home } from 'lucide-react'
import { useAuth } from '../../hooks'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const { login, isLoggingIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(form, {
      onSuccess: (res: any) => {
        const role = res.data.user.role
        if (role === 'admin') navigate('/admin')
        else if (role === 'delivery') navigate('/delivery')
        else navigate('/')
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Home button */}
        <div className="flex justify-start mb-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-600 bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-primary-300 px-4 py-2 rounded-xl transition-all shadow-sm">
            <Home size={15} /> Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-green">
              <span className="text-white font-display font-black text-4xl leading-none">Z</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl text-gray-900">ZINGER</span>
              <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">Grocery Delivered Fast</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-card-md border border-gray-100 p-7">
          <h2 className="font-display font-black text-2xl text-gray-900 mb-1">Welcome back!</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to continue shopping</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pr-11" placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoggingIn}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2">
              {isLoggingIn
                ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                : <>Sign In <ArrowRight size={17} /></>
              }
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">New to ZINGER?</span>
            </div>
          </div>

          <Link to="/register"
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 font-semibold rounded-2xl transition-all text-sm">
            Create an account
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">🔑 Demo Credentials</p>
          <div className="space-y-1.5 text-xs text-amber-700">
            {[
              { role: 'Customer', email: 'customer@test.com', pass: 'Customer@123' },
              { role: 'Admin',    email: 'admin@zinger.in',   pass: 'Admin@123456' },
              { role: 'Delivery', email: 'delivery@test.com', pass: 'Delivery@123' },
            ].map(d => (
              <div key={d.role} className="flex items-center gap-2">
                <span className="font-bold w-16">{d.role}:</span>
                <button onClick={() => setForm({ email: d.email, password: d.pass })}
                  className="text-amber-800 hover:underline cursor-pointer font-mono text-[11px]">
                  {d.email}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-amber-500 mt-2">Click any email to auto-fill credentials</p>
        </div>

      </div>
    </div>
  )
}
