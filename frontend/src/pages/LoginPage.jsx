import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { DEMO_ACCOUNTS } from '../utils/constants';
import { useToast } from '../components/common/Toast';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/feed';

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      addToast({
        title: 'Welcome back!',
        message: 'Successfully signed in to Peer Kudos.',
        type: 'success',
      });
      navigate(from, { replace: true });
    } catch (err) {
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'string') {
          setError(respData);
        } else if (respData.detail) {
          setError(respData.detail);
        } else if (respData.non_field_errors) {
          setError(respData.non_field_errors[0]);
        } else if (respData.email || respData.password) {
          setFieldErrors({
            email: respData.email?.[0],
            password: respData.password?.[0],
          });
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
      } else {
        setError('Unable to connect to the authentication server. Please verify backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('DemoUser123!');
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4 hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Welcome to <span className="text-indigo-600">Peer Kudos</span>
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Recognize peer excellence, award points, and build strong team culture.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sign In Failed</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Work Email"
              type="email"
              icon={Mail}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              error={fieldErrors.email}
              required
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  error={fieldErrors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Secure 7d Session</span>
              </span>
              <Link
                to="/forgot-password"
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full mt-2 shadow-md shadow-indigo-300 hover:shadow-lg transition-all"
              isLoading={isLoading}
            >
              Sign In to Peer Kudos
            </Button>
          </form>

          {/* 1-Click Demo Credentials Quick Switcher */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>1-Click Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Pre-seeded</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Click any colleague below to auto-fill verified credentials:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-left transition-all group focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                    {acc.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {acc.dept}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signup Link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          New team member without an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
          >
            Create account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
