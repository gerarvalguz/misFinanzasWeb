
import React, { useState, useEffect } from 'react';
import { Account } from '../types';

interface AccountFormProps {
  onSubmit: (name: string) => void;
  onClose: () => void;
  accountToEdit?: Account | null;
}

const AccountForm: React.FC<AccountFormProps> = ({ onSubmit, onClose, accountToEdit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
    } else {
      setName('');
    }
  }, [accountToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      setError('El nombre de la cuenta no puede estar vacío.');
      return;
    }
    onSubmit(name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Cuenta
        </label>
        <input
          type="text"
          id="accountName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if(error) setError('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Ej: Ahorros, Tarjeta de Crédito"
          autoFocus
        />
        {error && <p className="text-danger text-sm mt-1">{error}</p>}
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          {accountToEdit ? 'Actualizar Cuenta' : 'Crear Cuenta'}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
