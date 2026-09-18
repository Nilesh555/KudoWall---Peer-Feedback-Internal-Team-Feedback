import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Check, Coins, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserAutocomplete } from './UserAutocomplete';
import { PointSelector } from './PointSelector';
import { COMPANY_VALUES, POINT_OPTIONS } from '../../utils/constants';
import { kudosService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';

export const GiveKudosModal = ({ isOpen, onClose, onKudoCreated }) => {
  const { user, refreshProfile } = useAuth();
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
    } else if (points > availableAllowance) {
      errs.points = `Insufficient allowance. You have ${availableAllowance} points remaining.`;
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
      // Send payload WITHOUT sender_id (backend uses authenticated user)
      const response = await kudosService.giveKudos({
        receiver_id: receiver.id,
        points,
        company_value: companyValue,
        message: message.trim(),
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
        });
      } catch (e) {
        // Safe fallback
      }

      addToast({
        title: 'Kudos Sent!',
        message: `Successfully awarded ${points} points to ${receiver.name}!`,
        type: 'success',
      });

      // Refresh user's allowance and trigger feed reload
      await refreshProfile();
      window.dispatchEvent(new CustomEvent('kudo:created'));

      if (onKudoCreated && response.kudo) {
        onKudoCreated(response.kudo);
      }

      // Reset form state & close modal
      setReceiver(null);
      setPoints(20);
      setCompanyValue('Teamwork');
      setMessage('');
      setErrors({});
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        setErrors(errorData);
      }
      addToast({
        title: 'Failed to send Kudos',
        message:
          errorData?.detail ||
          errorData?.error ||
          errorData?.points?.[0] ||
          'Please verify your inputs and try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Give Kudos to a Peer"
      description="Recognize a colleague with points and celebration for embodying our company values."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Remaining Allowance Display */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-100 rounded-2xl text-xs">
          <span className="text-slate-600 font-semibold flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-indigo-500" />
            <span>Monthly Giving Allowance</span>
          </span>
          <span className="font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-indigo-100">
            {availableAllowance} points remaining
          </span>
        </div>

        {errors.non_field_errors && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errors.non_field_errors[0]}</span>
          </div>
        )}

        {/* 1. Recipient Autocomplete */}
        <UserAutocomplete
          selectedUser={receiver}
          onSelect={(u) => {
            setReceiver(u);
            if (errors.receiver || errors.receiver_id) {
              setErrors((prev) => ({ ...prev, receiver: null, receiver_id: null }));
            }
          }}
          error={errors.receiver || errors.receiver_id?.[0]}
        />

        {/* 2. Point Amount Selector (10, 20, 50) */}
        <PointSelector
          points={points}
          onChange={(pts) => {
            setPoints(pts);
            if (errors.points) setErrors((prev) => ({ ...prev, points: null }));
          }}
          availableAllowance={availableAllowance}
          error={errors.points}
        />

        {/* 3. Company Value Selector (#Teamwork, #CustomerObsession, #Innovation) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Embodying Company Value <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMPANY_VALUES.map((val) => {
              const isSelected = companyValue === val.key;
              return (
                <button
                  key={val.key}
                  type="button"
                  onClick={() => {
                    setCompanyValue(val.key);
                    if (errors.companyValue || errors.company_value) {
                      setErrors((prev) => ({ ...prev, companyValue: null, company_value: null }));
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{val.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">#{val.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                      {val.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {(errors.companyValue || errors.company_value) && (
            <p className="mt-1.5 text-xs text-rose-500 font-medium">
              {errors.companyValue || errors.company_value?.[0]}
            </p>
          )}
        </div>

        {/* 4. Recognition Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Recognition Note <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">{message.length}/500</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
            }}
            placeholder="What specifically did they accomplish? How did they demonstrate this value?"
            className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm transition-all placeholder:text-slate-400 focus:outline-none ${
              errors.message
                ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300'
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-rose-500 font-medium">
              {Array.isArray(errors.message) ? errors.message[0] : errors.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="md"
            icon={Sparkles}
            isLoading={isSubmitting}
            className="shadow-sm shadow-indigo-300"
          >
            Award {points} Points
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GiveKudosModal;
