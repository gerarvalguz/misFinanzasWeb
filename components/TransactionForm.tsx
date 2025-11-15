
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onSubmit: (transactionData: { description: string; amount: number; type: TransactionType }) => void;
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
  const [currentType, setCurrentType] = useState<TransactionType>(transactionType);
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setCurrentType(transactionToEdit.type);
    } else {
      setDescription('');
      setAmount('');
      setCurrentType(transactionType);
    }
  }, [transactionToEdit, transactionType]);

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
      type: currentType,
    });
  };
  
  const title = `${transactionToEdit ? 'Editar' : 'Añadir'} ${currentType === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 text-center">{title}</h3>
      
      <div className="flex justify-center space-x-4 pt-2">
        <button
          type="button"
          onClick={() => setCurrentType(TransactionType.INCOME)}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentType === TransactionType.INCOME ? 'bg-success text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => setCurrentType(TransactionType.EXPENSE)}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentType === TransactionType.EXPENSE ? 'bg-danger text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Gasto
        </button>
      </div>

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
          placeholder={currentType === TransactionType.INCOME ? 'Ej: Salario mensual' : 'Ej: Compra en supermercado'}
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
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${currentType === TransactionType.INCOME ? 'bg-success hover:bg-green-700 focus:ring-success' : 'bg-danger hover:bg-red-700 focus:ring-danger'}`}
        >
          {transactionToEdit ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
