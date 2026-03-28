import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Bot, Loader2, Mic, MicOff, ShoppingCart, Volume2, Sparkles } from 'lucide-react'
import { aiAPI, cartAPI } from '../../api'
import type { Product } from '../../types'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { useCartStore } from '../../store/cartStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  suggestedProducts?: Product[]
  isVoice?: boolean
  orderAction?: { type: 'add'; products: Product[] }
}

// Extend window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const QUICK_PROMPTS = [
  '🥛 Need dairy products',
  '🍎 Fresh fruits today',
  '🥗 Healthy snacks',
  '🛒 Order breakfast items',
  '💊 Personal care',
]

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm ZINGER AI — your smart grocery assistant. I can help you find products, place orders, and suggest recipes. You can also **speak** to me using the mic button! How can I help?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const { addToCart } = useCart()
  const { openCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen])

  // ── Voice recognition setup ──────────────────────────
  const startListening = useCallback(() => {
    if (!voiceSupported) { toast.error('Voice not supported in this browser'); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => { setIsListening(false); toast.error('Could not hear you. Try again.') }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      // Auto-send after voice input
      setTimeout(() => sendMessage(transcript), 300)
    }
    recognition.start()
  }, [voiceSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── Text-to-speech ───────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, '').substring(0, 200))
    utterance.lang = 'en-IN'
    utterance.rate = 1.05
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    synthRef.current.speak(utterance)
  }, [])

  // ── Parse AI response for order intent ──────────────
  const detectOrderIntent = (text: string, products: Product[]): boolean => {
    const orderKeywords = ['order', 'add to cart', 'buy', 'get me', 'i want', 'i need', 'place order']
    return orderKeywords.some(k => text.toLowerCase().includes(k)) && products.length > 0
  }

  // ── Add suggested products to cart ─────────────────
  const handleAddAllToCart = async (products: Product[]) => {
    if (!isAuthenticated) { toast.error('Please login to add items'); return }
    let added = 0
    for (const product of products.slice(0, 3)) {
      if (product.stock > 0) {
        addToCart({ productId: product._id, quantity: 1 })
        added++
      }
    }
    if (added > 0) {
      toast.success(`Added ${added} item${added > 1 ? 's' : ''} to cart!`)
      openCart()
    }
  }

  // ── Send message ─────────────────────────────────────
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if (!text || isLoading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text, isVoice: !!overrideText && !input }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const res = await aiAPI.chat(text, history)
      const { reply, suggestedProducts = [] } = res.data

      const hasOrderIntent = detectOrderIntent(text, suggestedProducts)

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        suggestedProducts,
        orderAction: hasOrderIntent && suggestedProducts.length > 0
          ? { type: 'add', products: suggestedProducts }
          : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Auto-speak reply if user used voice
      if (overrideText && !input) speak(reply)

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having a moment. Please try again! 🙏",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    const clean = prompt.replace(/^[^\w]+/, '').trim()
    setInput(clean)
    sendMessage(clean)
  }

  return (
    <>
      {/* ── Floating button ─────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95
          ${isOpen ? 'bg-gray-800 hover:bg-gray-900' : 'bg-primary-600 hover:bg-primary-700 animate-pulse-green'}`}
      >
        {isOpen
          ? <X size={22} className="text-white" />
          : <Sparkles size={22} className="text-white" />
        }
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <Bot size={9} className="text-gray-800" />
          </span>
        )}
      </button>

      {/* ── Chat window ─────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 md:bottom-24 md:right-6 z-40 w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-emerald-500 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-sm">ZINGER AI</p>
              <p className="text-primary-100 text-[10px]">Smart grocery assistant • Voice enabled</p>
            </div>
            {isSpeaking && (
              <div className="flex items-center gap-1">
                {[3, 5, 4, 6, 3].map((h, i) => (
                  <div key={i} className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={13} className="text-primary-600" />
                  </div>
                )}
                <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-card'
                  }`}>
                    {msg.isVoice && <span className="text-[10px] opacity-60 mr-1">🎤</span>}
                    {msg.content}
                  </div>

                  {/* Suggested products */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="w-full space-y-1.5">
                      {msg.suggestedProducts.slice(0, 3).map(p => (
                        <Link key={p._id} to={`/products/${p._id}`} onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl p-2 hover:border-primary-200 transition-colors shadow-sm">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={p.images?.[0]?.url} alt={p.name}
                              className="w-full h-full object-contain p-0.5"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-xs text-primary-600 font-bold">₹{p.discountedPrice || p.price}</p>
                          </div>
                        </Link>
                      ))}

                      {/* Add all to cart button */}
                      {msg.orderAction && (
                        <button
                          onClick={() => handleAddAllToCart(msg.orderAction!.products)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors">
                          <ShoppingCart size={13} /> Add {Math.min(msg.orderAction.products.length, 3)} item{msg.orderAction.products.length > 1 ? 's' : ''} to Cart
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-primary-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide bg-white border-t border-gray-100 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => handleQuickPrompt(p)}
                  className="flex-shrink-0 text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-2.5 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-gray-100 p-3 flex gap-2 bg-white flex-shrink-0">
            {/* Voice button */}
            {voiceSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Stop listening' : 'Speak to order'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isListening
                    ? 'bg-red-500 text-white voice-listening shadow-lg'
                    : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600'
                }`}>
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={isListening ? '🎤 Listening...' : 'Ask or say "order 2kg tomatoes"...'}
              className="flex-1 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />

            {/* Send */}
            <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
