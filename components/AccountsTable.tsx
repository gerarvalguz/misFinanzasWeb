import React from 'react';
import { Account, TransactionType } from '../types';
import { PencilIcon, TrashIcon } from './icons';

interface AccountsTableProps {
  accounts: Account[];
  onSelectAccount: (accountId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  selectedAccountId: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount).replace('MXN', '').trim();
};

const AccountsTable: React.FC<AccountsTableProps> = ({ accounts, onSelectAccount, onEditAccount, onDeleteAccount, selectedAccountId }) => {

  const calculateSummary = (account: Account) => {
    const income = account.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = account.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cuenta
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingresos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gastos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay cuentas. ¡Crea una para empezar!
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const { income, expense, balance } = calculateSummary(account);
                const isSelected = selectedAccountId === account.id;
                return (
                  <tr 
                    key={account.id} 
                    onClick={() => onSelectAccount(account.id)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-semibold">
                      {formatCurrency(income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-danger font-semibold">
                      {formatCurrency(expense)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${balance >= 0 ? 'text-gray-800' : 'text-danger'}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditAccount(account); }}
                          className="text-accent hover:text-secondary transition-colors"
                          aria-label={`Editar cuenta ${account.name}`}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteAccount(account.id); }}
                          className="text-danger hover:text-red-700 transition-colors"
                           aria-label={`Eliminar cuenta ${account.name}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsTable;