import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  { label: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { label: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { label: 'Snacks & Munchies', slug: 'snacks-munchies' },
  { label: 'Beverages', slug: 'beverages' },
  { label: 'Atta & Rice', slug: 'atta-rice' },
  { label: 'Personal Care', slug: 'personal-care' },
]

const LINKS = {
  Company: [
    { label: 'About ZINGER', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Blog', to: '/blog' },
    { label: 'Partner with Us', to: '/partner' },
  ],
  Help: [
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact Support', to: '/contact' },
    { label: 'Track Your Order', to: '/orders' },
    { label: 'Return Policy', to: '/returns' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookies' },
    { label: 'Refund Policy', to: '/refunds' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      {/* ── Top CTA strip ──────────────────────── */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-white text-lg">Get grocery delivered in 10 minutes</p>
            <p className="text-primary-100 text-sm mt-0.5">Download the ZINGER app for exclusive app-only deals</p>
          </div>
          <div className="flex gap-3">
            <a href="#" className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-lg">🍎</span> App Store
            </a>
            <a href="#" className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-lg">🤖</span> Play Store
            </a>
          </div>
        </div>
      </div>

      {/* ── Main footer ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-black text-2xl leading-none">Z</span>
              </div>
              <div>
                <span className="font-display font-black text-xl text-white tracking-tight">ZINGER</span>
                <p className="text-[9px] text-primary-500 font-semibold tracking-widest uppercase -mt-0.5">Grocery Delivered Fast</p>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">
              India's fastest grocery delivery. Fresh produce, dairy, snacks and household essentials delivered to your door in 10 minutes.
            </p>

            {/* Contact */}
            <div className="space-y-2 mb-5">
              {[
                { icon: <Phone size={13} />, text: '1800-123-ZINGER' },
                { icon: <Mail size={13} />, text: 'support@zinger.in' },
                { icon: <MapPin size={13} />, text: 'Mumbai, India' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-primary-500">{c.icon}</span> {c.text}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {[
                { icon: <Instagram size={16} />, href: '#' },
                { icon: <Facebook size={16} />, href: '#' },
                { icon: <Twitter size={16} />, href: '#' },
                { icon: <Youtube size={16} />, href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href}
                  className="w-8 h-8 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop by Category */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Shop by Category</p>
            <ul className="space-y-2">
              {CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`}
                    className="text-sm text-gray-500 hover:text-primary-400 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 -ml-2.5 group-hover:ml-0 transition-all text-primary-500" />
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-semibold text-white text-sm mb-3">{heading}</p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.to}>
                    <Link to={link.to}
                      className="text-sm text-gray-500 hover:text-primary-400 transition-colors flex items-center gap-1 group">
                      <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 -ml-2.5 group-hover:ml-0 transition-all text-primary-500" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────── */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} ZINGER Grocery Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">We accept:</span>
            <div className="flex gap-2 text-gray-500">
              {['💳', '🏦', '📱', '💵'].map((icon, i) => (
                <span key={i} className="text-sm">{icon}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
