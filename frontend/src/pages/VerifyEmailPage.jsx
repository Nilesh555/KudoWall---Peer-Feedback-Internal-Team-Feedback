import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Sparkles, Mail, KeyRound, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(queryEmail);
  const [token, setToken] = useState(queryToken);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  // Auto-verify if both email and token are provided in the URL query params
  useEffect(() => {
    if (queryEmail && queryToken) {
      handleVerification(queryEmail, queryToken);
    }
  }, [queryEmail, queryToken]);

  const handleVerification = async (emailToVerify, tokenToVerify) => {
    if (!emailToVerify || !tokenToVerify) {
      setStatus('error');
      setMessage('Both registered email and verification token are required.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const data = await authService.verifyEmail({
        email: emailToVerify.trim().toLowerCase(),
        token: tokenToVerify.trim(),
      });
      setStatus('success');
      setMessage(data.message || 'Email verified successfully! You can now sign in.');
      addToast({
        title: 'Email Verified',
        message: 'Your email has been verified. Welcome to Peer Kudos!',
        type: 'success',
      });
    } catch (err) {
      setStatus('error');
      const errDetail =
        err.response?.data?.detail ||
        err.response?.data?.token?.[0] ||
        err.response?.data?.email?.[0] ||
        'Invalid or expired verification token. Please verify the code or sign in.';
      setMessage(errDetail);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerification(email, token);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4 hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Verify Your <span className="text-indigo-600">Email</span>
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Confirm your corporate email address to activate your Peer Kudos account.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Email Verified!</h3>
                <p className="text-xs text-slate-500 mt-1">{message}</p>
              </div>
              <Button
                variant="accent"
                size="lg"
                className="w-full mt-3 shadow-md shadow-indigo-300"
                onClick={() => navigate('/login')}
              >
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <div>
              {status === 'error' && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verification Error</span>
                    <span>{message}</span>
                  </div>
                </div>
              )}

              <div className="mb-5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] text-slate-600">
                <p className="font-semibold text-indigo-900 mb-0.5">Verification Simulation</p>
                In this local development environment, tokens are generated instantly upon registration. You can submit the token below to confirm.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  icon={Mail}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Verification Token"
                  type="text"
                  icon={KeyRound}
                  placeholder="Paste verification token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full mt-2 shadow-md shadow-indigo-300 hover:shadow-lg transition-all"
                  isLoading={status === 'loading'}
                  icon={CheckCircle2}
                >
                  Verify Email Address
                </Button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already verified or want to use another account?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
          >
            Sign in here <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
