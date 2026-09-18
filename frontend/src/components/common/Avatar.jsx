import React, { useState } from 'react';
import { getInitials, getAvatarColor } from '../../utils/formatters';

export const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
  indicator = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-medium',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-white shadow-sm`}
        />
      ) : (
        <div
          className={`${sizes[size] || sizes.md} ${bgColor} text-white rounded-full flex items-center justify-center ring-2 ring-white shadow-sm select-none tracking-wider`}
        >
          {initials}
        </div>
      )}
      {indicator && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
};

export const UserAvatar = Avatar;
export default Avatar;
