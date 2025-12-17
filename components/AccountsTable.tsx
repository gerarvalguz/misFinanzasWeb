import React, { useMemo, useState } from 'react';
import { Account, TransactionType } from '../types';
import { PencilIcon, TrashIcon, GripVerticalIcon } from './icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AccountsTableProps {
  accounts: Account[];
  onSelectAccount: (accountId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onReorderAccounts: (activeId: string, overId: string) => void;
  selectedAccountId: string | null;
  showAll: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount).replace('MXN', '').trim();
};

interface AccountRowProps {
    account: Account;
    summary: { income: number; expense: number; balance: number; };
    isSelected: boolean;
    onSelectAccount: (accountId: string) => void;
    onEditAccount: (account: Account) => void;
    onDeleteAccount: (accountId: string) => void;
}

const SortableAccountRow: React.FC<AccountRowProps> = ({ account, summary, isSelected, onSelectAccount, onEditAccount, onDeleteAccount }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <tr 
            ref={setNodeRef}
            style={style}
            onClick={() => onSelectAccount(account.id)}
            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'} ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        >
            <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1" aria-label="Reordenar cuenta">
                    <GripVerticalIcon className="w-5 h-5" />
                </button>
                <div className="text-sm font-medium text-gray-900">{account.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-semibold">{formatCurrency(summary.income)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-danger font-semibold">{formatCurrency(summary.expense)}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${summary.balance >= 0 ? 'text-gray-800' : 'text-danger'}`}>{formatCurrency(summary.balance)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-4">
                    <button onClick={(e) => { e.stopPropagation(); onEditAccount(account); }} className="text-accent hover:text-secondary transition-colors" aria-label={`Editar cuenta ${account.name}`}><PencilIcon /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteAccount(account.id); }} className="text-danger hover:text-red-700 transition-colors" aria-label={`Eliminar cuenta ${account.name}`}><TrashIcon /></button>
                </div>
            </td>
        </tr>
    );
};


const AccountsTable: React.FC<AccountsTableProps> = ({ accounts, onSelectAccount, onEditAccount, onDeleteAccount, onReorderAccounts, selectedAccountId, showAll }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ACCOUNTS_PER_PAGE = 5;

  const paginatedAccounts = useMemo(() => {
    if (showAll) {
      return accounts;
    }
    const startIndex = (currentPage - 1) * ACCOUNTS_PER_PAGE;
    return accounts.slice(startIndex, startIndex + ACCOUNTS_PER_PAGE);
  }, [accounts, currentPage, showAll]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      onReorderAccounts(active.id, over.id);
    }
  };

  const paginatedAccountIds = useMemo(() => paginatedAccounts.map(acc => acc.id), [paginatedAccounts]);

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto ">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay cuentas. ¡Crea una para empezar!</td></tr>
                        ) : (
                            paginatedAccounts.map((account) => (
                                <SortableAccountRow
                                    key={account.id}
                                    account={account}
                                    summary={calculateSummary(account)}
                                    isSelected={selectedAccountId === account.id}
                                    onSelectAccount={onSelectAccount}
                                    onEditAccount={onEditAccount}
                                    onDeleteAccount={onDeleteAccount}
                                />
                            ))
                        )}
                    </tbody>
            </table>
        </DndContext>
        </div>
        {!showAll && accounts.length > ACCOUNTS_PER_PAGE && (
          <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >Anterior</button>
            <span className="text-sm text-gray-500">Página {currentPage} de {Math.ceil(accounts.length / ACCOUNTS_PER_PAGE)}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(accounts.length / ACCOUNTS_PER_PAGE)))}
              disabled={currentPage * ACCOUNTS_PER_PAGE >= accounts.length}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >Siguiente</button>
          </div>
        )}
      </div>
  );
};

export default AccountsTable;