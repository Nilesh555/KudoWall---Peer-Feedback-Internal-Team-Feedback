import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Check, ArrowLeft, Coins, Award } from 'lucide-react';
import { Button } from '../components/common/Button';
import { UserAutocomplete } from '../components/kudos/UserAutocomplete';
import { PointSelector } from '../components/kudos/PointSelector';
import { COMPANY_VALUES, POINT_OPTIONS } from '../utils/constants';
import { kudosService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';

export const GiveKudosPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [receiver, setReceiver] = useState(null);
  const [points, setPoints] = useState(20);
  const [companyValue, setCompanyValue] = useState('Teamwork');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAllowance = user?.giving_allowance ?? 100;

  const validate = () => {
    const errs = {};
    if (!receiver) {
      errs.receiver = 'Please select a colleague to recognize.';
    } else if (receiver.id === user?.id) {
      errs.receiver = 'You cannot award kudos points to yourself.';
    }
    if (!points || !POINT_OPTIONS.includes(points)) {
      errs.points = 'Points must be 10, 20, or 50.';
    }
    if (points > availableAllowance) {
      errs.points = `Insufficient balance. You have ${availableAllowance} points remaining.`;
    }
    if (!companyValue) {
      errs.companyValue = 'Please select a company core value.';
    }
    if (!message || message.trim().length < 5) {
      errs.message = 'Please provide a recognition note with at least 5 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await kudosService.giveKudos({
        receiver_id: receiver.id,
        points,
        company_value: companyValue,
        message: message.trim(),
      });

      // Trigger festive confetti
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
        });
      } catch (e) {
        // Safe fallback if canvas is not available
      }

      addToast({
        title: 'Kudos Sent!',
        message: `Successfully awarded ${points} points to ${receiver.name}.`,
        type: 'success',
      });

      // Refresh balance and notify components
      await refreshProfile();
      window.dispatchEvent(new CustomEvent('kudo:created'));

      // Navigate back to the live feed
      navigate('/feed');
    } catch (err) {
      const respData = err.response?.data;
      if (respData) {
        if (respData.points) {
          setErrors({ points: respData.points[0] });
        } else if (respData.detail) {
          setErrors({ general: respData.detail });
        } else if (respData.receiver_id) {
          setErrors({ receiver: respData.receiver_id[0] });
        } else {
          setErrors({ general: 'Failed to send kudos. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error occurred while giving kudos.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/feed')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Feed
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Give Kudos to a Peer</span>
            <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Express appreciation for a colleague's hard work, impact, and shared company values.
          </p>
        </div>

        {/* Live Allowance Balance Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
            <Coins className="w-3.5 h-3.5 text-indigo-500" />
            <span>Giving Allowance</span>
          </div>
          <span className="text-lg font-black text-indigo-600 block leading-tight mt-0.5">
            {availableAllowance} <span className="text-xs font-normal text-slate-400">pts</span>
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
        {errors.general && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Choose Recipient
            </label>
            <UserAutocomplete
              selectedUser={receiver}
              onSelect={(u) => {
                setReceiver(u);
                if (errors.receiver) setErrors((prev) => ({ ...prev, receiver: null }));
              }}
              error={errors.receiver}
            />
          </div>

          {/* Points Selection */}
          <PointSelector
            points={points}
            onChange={(pts) => {
              setPoints(pts);
              if (errors.points) setErrors((prev) => ({ ...prev, points: null }));
            }}
            availableAllowance={availableAllowance}
            error={errors.points}
          />

          {/* Company Core Value */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              3. Highlight a Company Value
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {COMPANY_VALUES.map((val) => {
                const isSelected = companyValue === val.key;
                return (
                  <button
                    key={val.key}
                    type="button"
                    onClick={() => {
                      setCompanyValue(val.key);
                      if (errors.companyValue) {
                        setErrors((prev) => ({ ...prev, companyValue: null }));
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{val.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">#{val.label}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                        {val.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.companyValue && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.companyValue}</p>
            )}
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Recognition Note
              </label>
              <span className="text-[11px] text-slate-400">{message.length} / 500</span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="What specifically did they accomplish? How did they embody this value?"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
            />
            {errors.message && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/feed')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              icon={Sparkles}
              isLoading={isSubmitting}
              className="shadow-md shadow-indigo-300 hover:shadow-lg"
            >
              Award {points} Points
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GiveKudosPage;
