import React from 'react';

const Button = ({ children, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-outline',
  };

  return (
    <button className={variants[variant] || variants.primary} {...props}>
      {children}
    </button>
  );
};

export default Button;