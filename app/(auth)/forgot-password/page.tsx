'use client';
import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';
import toast from 'react-hot-toast';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
                          bg-blue-500 rounded-2xl mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700
                        rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-white font-semibold text-lg mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm">
                We sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 mt-6 text-blue-400
                           hover:text-blue-300 transition text-sm">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-700/60 border border-slate-600 text-white
                             placeholder-slate-400 rounded-xl px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                           text-white font-semibold rounded-xl py-3 transition"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link href="/login"
                className="flex items-center justify-center gap-2 text-slate-400
                           hover:text-slate-200 transition text-sm">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
