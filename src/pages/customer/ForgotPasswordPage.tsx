import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

function ZingerLogo() {
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex flex-col items-center gap-2">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-green">
          <span className="text-white font-display font-black text-3xl leading-none">Z</span>
        </div>
        <span className="font-display font-black text-xl text-gray-900">ZINGER</span>
      </Link>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ZingerLogo />
        <div className="bg-white rounded-3xl shadow-card-md border border-gray-100 p-7">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Check your inbox!</h2>
              <p className="text-gray-500 text-sm mb-6">If that email exists, we've sent a password reset link. Check your spam folder too.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Forgot password?</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-2">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const token = searchParams.get('token') || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword(token, password)
      setDone(true)
    } catch {
      toast.error('Reset link expired. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ZingerLogo />
        <div className="bg-white rounded-3xl shadow-card-md border border-gray-100 p-7">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Password reset!</h2>
              <p className="text-gray-500 text-sm mb-6">Your password has been updated. You can now sign in.</p>
              <Link to="/login" className="btn-primary inline-flex">Sign In Now</Link>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Set new password</h2>
              <p className="text-gray-400 text-sm mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    className="input" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    className="input" placeholder="Repeat your password" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ZingerLogo />
        <div className="bg-white rounded-3xl shadow-card-md border border-gray-100 p-7 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Check your email!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            We've sent a verification link to your email. Click it to activate your ZINGER account.
          </p>
          <Link to="/" className="btn-primary inline-flex">Start Shopping</Link>
          <p className="text-xs text-gray-400 mt-4">Didn't get it? Check your spam folder.</p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
