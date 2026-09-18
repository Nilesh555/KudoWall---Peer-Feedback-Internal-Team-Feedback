import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Building,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { AVATAR_PRESETS } from '../utils/constants';

export const SignupPage = () => {
  const { signup, verifyEmail, login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated email verification prompt modal
  const [simulationData, setSimulationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load departments from API
  useEffect(() => {
    let isMounted = true;
    const fetchDepts = async () => {
      try {
        const data = await userService.getDepartments();
        const list = Array.isArray(data) ? data : data.results || [];
        if (isMounted) {
          setDepartments(list);
          if (list.length > 0 && !departmentId) {
            setDepartmentId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Fallback to standard departments', err);
        if (isMounted) {
          setDepartments([
            { id: 1, name: 'Engineering' },
            { id: 2, name: 'Design' },
            { id: 3, name: 'Marketing' },
            { id: 4, name: 'Sales' },
          ]);
          setDepartmentId(1);
        }
      }
    };
    fetchDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid work email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!departmentId) {
      errors.department = 'Please select your department.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const selectedAvatar = showCustomAvatarInput && customAvatarUrl.trim()
        ? customAvatarUrl.trim()
        : avatar;

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        department_id: departmentId ? parseInt(departmentId, 10) : undefined,
        avatar: selectedAvatar || undefined,
      };

      const response = await signup(payload);

      if (response.verification_simulation) {
        setSimulationData(response.verification_simulation);
        addToast({
          title: 'Account created!',
          message: 'Please complete email verification.',
          type: 'info',
        });
      } else {
        addToast({
          title: 'Registration successful',
          message: 'Please check your email to verify your account.',
          type: 'success',
        });
        navigate('/login');
      }
    } catch (err) {
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'string') {
          setGeneralError(respData);
        } else if (respData.email) {
          setFieldErrors((prev) => ({ ...prev, email: respData.email[0] }));
        } else if (respData.password) {
          setFieldErrors((prev) => ({ ...prev, password: respData.password[0] }));
        } else if (respData.name) {
          setFieldErrors((prev) => ({ ...prev, name: respData.name[0] }));
        } else if (respData.detail) {
          setGeneralError(respData.detail);
        } else {
          setGeneralError('Registration failed. Please check form entries.');
        }
      } else {
        setGeneralError('Unable to connect to the backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatedVerify = async () => {
    if (!simulationData) return;
    setIsVerifying(true);
    try {
      await verifyEmail(simulationData.email, simulationData.verification_token);
      addToast({
        title: 'Email verified!',
        message: 'Account verified! Signing you into Peer Kudos...',
        type: 'success',
      });
      // Automatically log in newly verified user
      await login(simulationData.email, password);
      navigate('/feed');
    } catch (err) {
      addToast({
        title: 'Verification failed',
        message: err.response?.data?.detail || 'Failed to verify simulated token.',
        type: 'error',
      });
      navigate(`/verify-email?email=${encodeURIComponent(simulationData.email)}&token=${encodeURIComponent(simulationData.verification_token)}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3 hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Join <span className="text-indigo-600">Peer Kudos</span>
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Start recognizing peers with a monthly allowance of <span className="font-bold text-indigo-600">100 giving points</span>.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {generalError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Account Creation Issue</span>
                <span>{generalError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              icon={User}
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
              }}
              error={fieldErrors.name}
              required
            />

            {/* Work Email */}
            <Input
              label="Work Email Address"
              type="email"
              icon={Mail}
              placeholder="maya@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              error={fieldErrors.email}
              required
            />

            {/* Passwords in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Min 8 characters"
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

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  error={fieldErrors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Department Selector */}
            <div>
              <label
                htmlFor="department_select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <select
                  id="department_select"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    if (fieldErrors.department) setFieldErrors((prev) => ({ ...prev, department: null }));
                  }}
                  className="block w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300 transition-colors"
                >
                  <option value="">Choose Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.department && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.department}</p>
              )}
            </div>

            {/* Avatar Selector & Preview */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Choose Profile Avatar
              </label>

              <div className="flex items-center gap-4">
                {/* Live Preview */}
                <div className="relative shrink-0">
                  <Avatar
                    src={showCustomAvatarInput && customAvatarUrl ? customAvatarUrl : avatar}
                    name={name || 'Colleague'}
                    size="lg"
                    indicator={true}
                  />
                </div>

                {/* Preset Options */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_PRESETS.map((p) => {
                      const isSelected = !showCustomAvatarInput && avatar === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setShowCustomAvatarInput(false);
                            setAvatar(p.url);
                          }}
                          className={`relative rounded-xl p-0.5 border-2 transition-all focus:outline-none ${
                            isSelected
                              ? 'border-indigo-600 scale-105 shadow-xs'
                              : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        showCustomAvatarInput
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Custom URL
                    </button>
                  </div>

                  {showCustomAvatarInput && (
                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full mt-4 shadow-md shadow-indigo-300 hover:shadow-lg transition-all"
              isLoading={isLoading}
            >
              Complete Registration
            </Button>
          </form>
        </div>

        {/* Existing Member Link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already part of the team?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
          >
            Sign in to Peer Kudos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>

      {/* Simulated Email Verification Modal */}
      <Modal
        isOpen={Boolean(simulationData)}
        onClose={() => navigate('/login')}
        title="Email Verification Simulation"
        description="Because this technical assessment runs in a local environment without a real mail server, email verification is simulated here."
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Simulated Verification Token</span>
            </div>
            <p className="text-xs text-slate-600">
              Account created for <span className="font-semibold text-slate-900">{simulationData?.email}</span>. Click below to verify and enter Peer Kudos immediately:
            </p>
            <div className="mt-2 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-indigo-100 break-all text-indigo-900 select-all">
              Token: {simulationData?.verification_token}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                navigate(
                  `/verify-email?email=${encodeURIComponent(simulationData?.email)}&token=${encodeURIComponent(
                    simulationData?.verification_token
                  )}`
                );
              }}
            >
              Open Verification Page
            </Button>
            <Button
              variant="accent"
              onClick={handleSimulatedVerify}
              isLoading={isVerifying}
              icon={CheckCircle2}
            >
              Verify & Sign In Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SignupPage;
