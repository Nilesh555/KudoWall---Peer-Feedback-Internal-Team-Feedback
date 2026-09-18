import React from 'react';
import { getCompanyValueMeta } from '../../utils/formatters';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    points: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold shadow-sm',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-1.5 font-medium',
  };

  const content =
    children && typeof children === 'object' && !React.isValidElement(children)
      ? children.name || children.label || children.title || ''
      : children;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border border-transparent select-none ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {content}
    </span>
  );
};

export const CompanyValueBadge = ({ valueKey, size = 'md', className = '', showHash = false }) => {
  const meta = getCompanyValueMeta(valueKey);
  const displayText = showHash ? (meta.label.startsWith('#') ? meta.label : `#${meta.label}`) : meta.label;

  return (
    <Badge
      size={size}
      className={`border ring-1 ring-inset font-bold ${meta.color} ${className}`}
      icon={<span className="text-xs">{meta.icon}</span>}
    >
      {displayText}
    </Badge>
  );
};

export const ValueTag = CompanyValueBadge;
export default Badge;
