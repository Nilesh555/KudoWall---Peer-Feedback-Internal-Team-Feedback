import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const data = await authService.forgotPassword(email.trim().toLowerCase());
      if (data.simulation) {
        setSimulation(data.simulation);
        addToast({
          title: 'Reset Link Generated',
          message: 'Password reset token generated successfully.',
          type: 'info',
        });
      } else {
        addToast({
          title: 'Email Sent',
          message: data.message || 'If an account exists, a reset link has been dispatched.',
          type: 'info',
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'No active account found with this email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4 hover:scale-105 transition-transform">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Forgot <span className="text-indigo-600">Password?</span>
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Enter your registered work email to receive a password reset token.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Reset Request Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {simulation ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Simulated Reset Token Generated</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In this local evaluation environment, the cryptographic reset token is ready below:
                </p>
                <div className="mt-2 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-indigo-100 break-all text-indigo-900 select-all space-y-1">
                  <div><strong>UID:</strong> {simulation.uidb64}</div>
                  <div><strong>Token:</strong> {simulation.token}</div>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                className="w-full shadow-md shadow-indigo-300"
                onClick={() =>
                  navigate(`/reset-password?uidb64=${simulation.uidb64}&token=${simulation.token}`)
                }
              >
                Proceed to Reset Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Work Email"
                type="email"
                icon={Mail}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full mt-2 shadow-md shadow-indigo-300 hover:shadow-lg transition-all"
                isLoading={isLoading}
              >
                Send Password Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
