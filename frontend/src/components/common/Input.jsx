import React from 'react';

const Input = ({ label, type = 'text', className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="input-label">{label}</label>}
      <input type={type} className={`input-field ${className}`} {...props} />
    </div>
  );
};

export default Input;