'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { MessageCircle, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Min 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
  email:    z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const checks = [
    { label: 'At least 8 characters',   ok: password.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Contains number',          ok: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.username, data.name);
      toast.success('Account created! Please verify your email.');
      router.push('/chat');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
                          bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-1">Join the conversation</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700
                        rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                {...register('name')}
                placeholder="John Doe"
                className="w-full bg-slate-700/60 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username <span className="text-slate-500 text-xs">(cannot be changed)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  @
                </span>
                <input
                  {...register('username')}
                  placeholder="johndoe"
                  className="w-full bg-slate-700/60 border border-slate-600 text-white
                             placeholder-slate-400 rounded-xl pl-8 pr-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-slate-700/60 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/60 border border-slate-600 text-white
                             placeholder-slate-400 rounded-xl px-4 py-3 pr-11 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-200 transition">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength checklist */}
              <div className="mt-2 space-y-1">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-2">
                    {c.ok
                      ? <CheckCircle size={13} className="text-green-400" />
                      : <XCircle    size={13} className="text-slate-500" />
                    }
                    <span className={`text-xs ${c.ok ? 'text-green-400' : 'text-slate-500'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <input
                {...register('confirm')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-700/60 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {errors.confirm && (
                <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                         disabled:cursor-not-allowed text-white font-semibold
                         rounded-xl py-3 transition-all duration-200 mt-2
                         shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
