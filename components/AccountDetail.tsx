import React, { useCallback, useMemo } from 'react';
import { Account, Transaction, TransactionType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, GripVerticalIcon } from './icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AccountDetailProps {
  account: Account | null;
  onAddTransaction: (type: TransactionType) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (accountId: string, transactionId: string) => void;
  onReorderTransactions: (accountId: string, activeId: string, overId: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount).replace('MXN', '').trim();
};

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const SortableTransactionRow: React.FC<TransactionRowProps> = ({ transaction, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: transaction.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    const isIncome = transaction.type === TransactionType.INCOME;

    return (
        <li 
            ref={setNodeRef} 
            style={style} 
            {...attributes}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors bg-white"
        >
            <div className="flex items-center space-x-2">
                <button {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1" aria-label="Reordenar transacción">
                    <GripVerticalIcon className="w-5 h-5" />
                </button>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${isIncome ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
                  {isIncome ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                </span>
                <div>
                    <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <p className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-danger'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
                <button onClick={() => onEdit(transaction)} className="text-gray-400 hover:text-accent transition-colors" aria-label={`Editar transacción ${transaction.description}`}>
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(transaction.id)} className="text-gray-400 hover:text-danger transition-colors" aria-label={`Eliminar transacción ${transaction.description}`}>
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
};


const AccountDetail: React.FC<AccountDetailProps> = ({ account, onAddTransaction, onEditTransaction, onDeleteTransaction, onReorderTransactions }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDelete = useCallback((transactionId: string) => {
    if (account) {
        onDeleteTransaction(account.id, transactionId);
    }
  }, [account, onDeleteTransaction]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (account && active.id !== over.id) {
      onReorderTransactions(account.id, active.id, over.id);
    }
  };

  const transactionIds = useMemo(() => account?.transactions.map(t => t.id) ?? [], [account?.transactions]);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8 rounded-lg shadow-lg">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700">Selecciona una cuenta</h3>
        <p className="text-gray-500 mt-2">Elige una cuenta de la lista para ver sus transacciones o crea una nueva.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{account.name}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onAddTransaction(TransactionType.INCOME)}
              className="flex items-center space-x-2 px-3 py-2 bg-success text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Ingreso</span>
            </button>
            <button
              onClick={() => onAddTransaction(TransactionType.EXPENSE)}
              className="flex items-center space-x-2 px-3 py-2 bg-danger text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Gasto</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {account.transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Esta cuenta no tiene transacciones.</p>
            <p className="text-gray-400 text-sm mt-1">Añade un ingreso o un gasto para empezar.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={transactionIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {account.transactions.map((transaction) => (
                  <SortableTransactionRow key={transaction.id} transaction={transaction} onEdit={onEditTransaction} onDelete={handleDelete} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;