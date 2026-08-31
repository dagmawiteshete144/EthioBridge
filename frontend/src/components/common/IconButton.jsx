import React from 'react';

const VARIANTS = {
  ghost: 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20',
  primary: 'text-white bg-primary-600 hover:bg-primary-700 shadow-sm',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
  outline: 'text-gray-600 border border-gray-300 hover:border-primary-500 hover:text-primary-600 dark:text-gray-300 dark:border-gray-600 dark:hover:border-primary-400',
};

const SIZES = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  type = 'button',
  variant = 'ghost',
  size = 'md',
  iconSize = 16,
  className = '',
  title,
  disabled,
  ...props
}) {
  if (!Icon) return null;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors ${VARIANTS[variant] || VARIANTS.ghost} ${SIZES[size] || SIZES.md} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </button>
  );
}
