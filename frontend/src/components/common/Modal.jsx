import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${maxWidth}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;