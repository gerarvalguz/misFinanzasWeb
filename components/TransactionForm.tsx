
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onSubmit: (transactionData: { description: string; amount: number }) => void;
  onClose: () => void;
  transactionType: TransactionType;
  transactionToEdit?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onClose,
  transactionType,
  transactionToEdit,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
    } else {
      setDescription('');
      setAmount('');
    }
  }, [transactionToEdit]);

  const validate = () => {
    const newErrors: { description?: string; amount?: string } = {};
    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria.';
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      description,
      amount: parseFloat(amount),
    });
  };
  
  const title = `${transactionToEdit ? 'Editar' : 'Añadir'} ${transactionType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full px-3 py-2 border ${errors.description ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
          placeholder={transactionType === TransactionType.INCOME ? 'Ej: Salario mensual' : 'Ej: Compra en supermercado'}
          autoFocus
        />
        {errors.description && <p className="text-danger text-sm mt-1">{errors.description}</p>}
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Monto
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full pl-7 pr-3 py-2 border ${errors.amount ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount}</p>}
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
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${transactionType === TransactionType.INCOME ? 'bg-success hover:bg-green-700 focus:ring-success' : 'bg-danger hover:bg-red-700 focus:ring-danger'}`}
        >
          {transactionToEdit ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
