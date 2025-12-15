import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Account, Transaction, TransactionType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, GripVerticalIcon, EyeIcon, EyeSlashIcon, MinusIcon } from './icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AccountDetailProps {
  account: Account | null;
  onAddTransaction: (type: TransactionType) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (accountId: string, transactionId: string) => void;
  onReorderTransactions: (accountId: string, activeId: string, overId: string, paginatedTransactions: Transaction[]) => void;
  onSearchTransactions: (term: string) => void;
  transactionSearchTerm: string;
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
            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors bg-white"
        >
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
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
            <div className="flex items-center space-x-4 self-end sm:self-center">
                <p className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-danger'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(transaction)} className="text-gray-400 hover:text-accent transition-colors" aria-label={`Editar transacción ${transaction.description}`}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(transaction.id)} className="text-gray-400 hover:text-danger transition-colors" aria-label={`Eliminar transacción ${transaction.description}`}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </li>
    );
};


const AccountDetail: React.FC<AccountDetailProps> = ({ account, onAddTransaction, onEditTransaction, onDeleteTransaction, onReorderTransactions, onSearchTransactions, transactionSearchTerm }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const TRANSACTIONS_PER_PAGE = 5;

  useEffect(() => {
    // Reset page and search when account changes
    onSearchTransactions('');
    setCurrentPage(1);
  }, [account?.id, onSearchTransactions]);

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
      onReorderTransactions(account.id, active.id, over.id, paginatedTransactions);
    }
  };

  const paginatedTransactions = useMemo(() => {
    if (showAll) {
      return account?.transactions ?? [];
    }
    const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    return account?.transactions.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE) ?? [];
  }, [account?.transactions, currentPage, showAll]);
  
  const paginatedTransactionIds = useMemo(() => paginatedTransactions.map(t => t.id), [paginatedTransactions]);

  const totalTransactions = account?.transactions.length ?? 0;
  const totalPages = Math.ceil(totalTransactions / TRANSACTIONS_PER_PAGE);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [transactionSearchTerm]);
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
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{account.name}</h2>
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
              className="flex items-center space-x-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-secondary transition-colors"
            >
              <MinusIcon className="w-4 h-4" />
              <span>Gasto</span>
            </button>
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              {showAll ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              <span>{showAll ? 'Mostrar Paginado' : 'Mostrar Todo'}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200">
        <input
            type="text"
            placeholder="Buscar transacciones..."
            value={transactionSearchTerm}
            onChange={(e) => onSearchTransactions(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
        />
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col">
        {account.transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">{transactionSearchTerm ? 'No se encontraron transacciones.' : 'Esta cuenta no tiene transacciones.'}</p>
            <p className="text-gray-400 text-sm mt-1">Añade un ingreso o un gasto para empezar.</p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col justify-between pt-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={paginatedTransactionIds} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {paginatedTransactions.map((transaction) => (
                    <SortableTransactionRow key={transaction.id} transaction={transaction} onEdit={onEditTransaction} onDelete={handleDelete} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {!showAll && totalTransactions > TRANSACTIONS_PER_PAGE && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >Anterior</button>
                <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >Siguiente</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;