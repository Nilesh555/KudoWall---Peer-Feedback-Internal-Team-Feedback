import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2, UserCheck } from 'lucide-react';
import { userService } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { getDepartmentName } from '../../utils/formatters';

export const UserAutocomplete = ({ selectedUser, onSelect, error }) => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (selectedUser) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.getUsers({
          search: query.trim(),
          exclude_self: true,
        });
        const rawList = data.results || (Array.isArray(data) ? data : []);
        // Extra client-side filter to guarantee self-selection is impossible
        const filtered = rawList.filter((u) => u.id !== currentUser?.id);
        setUsers(filtered);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedUser, currentUser?.id]);

  const handleSelect = (user) => {
    if (user.id === currentUser?.id) {
      return; // Self-gifting prevented
    }
    onSelect(user);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
        Select Recipient <span className="text-rose-500">*</span>
      </label>

      {selectedUser ? (
        <div className="flex items-center justify-between p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <Avatar src={selectedUser.avatar} name={selectedUser.name} size="sm" indicator={true} />
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {selectedUser.name}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{selectedUser.email}</span>
                {getDepartmentName(selectedUser.department) && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">
                      {getDepartmentName(selectedUser.department)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            title="Remove selected colleague"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search colleague by name or email..."
            className={`block w-full pl-9 pr-3.5 py-2.5 rounded-2xl border text-sm transition-all ${
              error
                ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300'
            }`}
          />

          {/* Autocomplete Results Dropdown */}
          {isOpen && (
            <div className="absolute z-20 mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto divide-y divide-slate-50">
              {users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.email} {getDepartmentName(user.department) && `• ${getDepartmentName(user.department)}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isLoading ? 'Searching team members...' : 'No matching colleagues found.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default UserAutocomplete;
