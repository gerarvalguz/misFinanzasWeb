import React, { useState, useMemo, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Account, Transaction, TransactionType } from './types';
import AccountsTable from './components/AccountsTable';
import AccountDetail from './components/AccountDetail';
import Modal from './components/Modal';
import AccountForm from './components/AccountForm';
import TransactionForm from './components/TransactionForm';
import { PlusIcon, EyeIcon, EyeSlashIcon } from './components/icons';
import { arrayMove } from '@dnd-kit/sortable';
import ExportButton from './components/ExportButton';

type AccountSortKey = 'name' | 'balance' | 'income' | 'expense';
type TransactionSortKey = 'description' | 'amount' | 'date';
type SortDirection = 'asc' | 'desc';
const App: React.FC = () => {
    const handleExportData = () => {
        try {
            const dataToExport = {
                accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
                selectedAccountId: JSON.parse(localStorage.getItem('selectedAccountId') || 'null'),
            };
            const jsonData = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gastos-personales-backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Hubo un error al exportar los datos.");
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const result = e.target?.result as string;
                if (!result) throw new Error("El archivo está vacío.");

                const importedData = JSON.parse(result);

                if (importedData && Array.isArray(importedData.accounts)) {
                    if (window.confirm("¿Estás seguro? Esto reemplazará todos tus datos actuales.")) {
                        localStorage.setItem('accounts', JSON.stringify(importedData.accounts));
                        localStorage.setItem('selectedAccountId', JSON.stringify(importedData.selectedAccountId || null));
                        alert("Datos importados con éxito. La aplicación se recargará.");
                        window.location.reload();
                    }
                } else {
                    alert("El archivo de importación no tiene el formato correcto.");
                }
            } catch (error) {
                console.error("Error al importar datos:", error);
                alert("Hubo un error al procesar el archivo. Asegúrate de que sea un archivo de respaldo válido.");
            } finally {
                event.target.value = ''; // Permite volver a seleccionar el mismo archivo
            }
        };
        reader.readAsText(file);
    };

    const [accounts, setAccounts] = useLocalStorage<Account[]>('accounts', []);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [accountSortConfig, setAccountSortConfig] = useState<{ key: AccountSortKey; direction: SortDirection } | null>(null);
    const [transactionSearchTerm, setTransactionSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<'account' | 'transaction' | null>(null);

    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
        const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
        const [transactionTypeForForm, setTransactionTypeForForm] = useState<TransactionType>(TransactionType.EXPENSE);
        const [showAllAccounts, setShowAllAccounts] = useState(false);
    const selectedAccount = useMemo(() => {
        if (!selectedAccountId) return null;
        return accounts.find(acc => acc.id === selectedAccountId) || null;
    }, [accounts, selectedAccountId]);

    const calculateAccountSummary = useCallback((account: Account) => {
        const income = account.transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = account.transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, balance: income - expense };
    }, []);

    const sortedAndFilteredAccounts = useMemo(() => {
        let filtered = accounts;
        if (!accountSearchTerm.trim()) {
            filtered = accounts;
        } else {
            filtered = accounts.filter(account =>
                account.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
            );
        }

        if (accountSortConfig !== null) {
            const sortableAccounts = [...filtered];
            sortableAccounts.sort((a, b) => {
                let aValue, bValue;

                if (accountSortConfig.key === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                } else {
                    const aSummary = calculateAccountSummary(a);
                    const bSummary = calculateAccountSummary(b);
                    aValue = aSummary[sortConfig.key];
                    bValue = bSummary[sortConfig.key];
                }

                if (aValue < bValue) {
                    return accountSortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return accountSortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
            return sortableAccounts;
        }
        return filtered;
    }, [accounts, accountSearchTerm, accountSortConfig, calculateAccountSummary]);

    const processedSelectedAccount = useMemo(() => {
        if (!selectedAccount) return null;

        let transactions = [...selectedAccount.transactions];

        // Filter transactions
        if (transactionSearchTerm.trim()) {
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(transactionSearchTerm.toLowerCase())
            );
        }

        return { ...selectedAccount, transactions };

    }, [selectedAccount, transactionSearchTerm]);

    const handleOpenModal = useCallback((content: 'account' | 'transaction') => {
        setModalContent(content);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setAccountToEdit(null);
        setTransactionToEdit(null);
        setModalContent(null);
    }, []);

    const handleSortAccounts = useCallback((key: AccountSortKey) => {
        setAccountSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === key && prevConfig.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return { key, direction: 'asc' };
        });
    }, []);


    // Account Handlers
    const handleAddAccount = useCallback((name: string) => {
        const newAccount: Account = {
            id: crypto.randomUUID(),
            name,
            transactions: [],
        };
        setAccounts(prev => [...prev, newAccount]);
        handleCloseModal();
    }, [setAccounts, handleCloseModal]);

    const handleEditAccount = useCallback((account: Account) => {
        setAccountToEdit(account);
        handleOpenModal('account');
    }, [handleOpenModal]);

    const handleUpdateAccount = useCallback((name: string) => {
        if (!accountToEdit) return;
        setAccounts(prev => prev.map(acc => acc.id === accountToEdit.id ? { ...acc, name } : acc));
        handleCloseModal();
    }, [accountToEdit, setAccounts, handleCloseModal]);

    const handleDeleteAccount = useCallback((accountId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta y todas sus transacciones?')) {
            setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== accountId));
            if (selectedAccountId === accountId) {
                setSelectedAccountId(null);
            }
        }
    }, [selectedAccountId, setAccounts]);

    // Transaction Handlers
    const handleAddTransactionClick = useCallback((type: TransactionType) => {
        setTransactionTypeForForm(type);
        setTransactionToEdit(null);
        handleOpenModal('transaction');
    }, [handleOpenModal]);

    const handleAddOrUpdateTransaction = useCallback((data: { description: string; amount: number; type: TransactionType }) => {
        if (!selectedAccountId) return;

        setAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.id === selectedAccountId) {
                if (transactionToEdit) { // Update existing transaction
                    const updatedTransactions = acc.transactions.map(t =>
                        t.id === transactionToEdit.id ? { ...transactionToEdit, ...data } : t
                    );
                    return { ...acc, transactions: updatedTransactions };
                } else { // Add new transaction
                    const newTransaction: Transaction = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        type: transactionTypeForForm,
                        ...data,
                    };
                    return { ...acc, transactions: [...acc.transactions, newTransaction] };
                }
            }
            return acc;
        }));

        handleCloseModal();
    }, [selectedAccountId, transactionToEdit, transactionTypeForForm, setAccounts, handleCloseModal]);
    
    const handleEditTransaction = useCallback((transaction: Transaction) => {
        setTransactionToEdit(transaction);
        setTransactionTypeForForm(transaction.type);
        handleOpenModal('transaction');
    }, [handleOpenModal]);

    const handleDeleteTransaction = useCallback((accountId: string, transactionId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
        
        setAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.id === accountId) {
                return {
                    ...acc,
                    transactions: acc.transactions.filter(t => t.id !== transactionId),
                };
            }
            return acc;
        }));
    }, [setAccounts]);

    const handleReorderAccounts = useCallback((activeId: string, overId: string) => {
        if (activeId === overId) return;
    
        setAccounts(items => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            if (oldIndex === -1 || newIndex === -1) return items;

            return arrayMove(items, oldIndex, newIndex);
        });
    }, [setAccounts]);

    const handleReorderTransactions = useCallback((accountId: string, activeId: string, overId: string) => {
        if (activeId === overId) return;
    
        setAccounts(prevAccounts => {
            const accountIndex = prevAccounts.findIndex(acc => acc.id === accountId);
            if (accountIndex === -1) return prevAccounts;

            const account = prevAccounts[accountIndex];
            const oldIndex = account.transactions.findIndex(t => t.id === activeId);
            const newIndex = account.transactions.findIndex(t => t.id === overId);

            if (oldIndex === -1 || newIndex === -1) return prevAccounts;

            const newTransactions = arrayMove(account.transactions, oldIndex, newIndex);
            const newAccounts = [...prevAccounts];
            newAccounts[accountIndex] = { ...account, transactions: newTransactions };
            return newAccounts;
        });
    }, [setAccounts]);
    
    const totalBalance = useMemo(() => {
        return accounts.reduce((total, account) => {
            const income = account.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
            const expense = account.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            return total + income - expense;
        }, 0);
    }, [accounts]);

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="bg-primary shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-onPrimary">Finanzas Personales</h1>
                     <div className="text-right">
                        <span className="text-sm text-blue-200">Balance Total</span>
                        <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
                           {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalBalance).replace('MXN', '').trim()}
                        </p>
                    </div>
                </div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-2 flex justify-end items-center space-x-2">
                  <input
                      type="file"
                      id="import"
                      accept="application/json"
                      onChange={handleImportData}
                      className="hidden"
                  />
                  <label htmlFor="import" className="bg-secondary text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 transition-colors text-sm">Importar</label>
                  <button onClick={handleExportData} className="bg-secondary text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm">Exportar</button>
               </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                 <div className="grid grid-cols-1 lg:grid-cols-[minmax(600px,_1.5fr)_1fr] gap-8">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-0">Resumen de Cuentas</h2>
														<div className="flex items-center space-x-2">
															<ExportButton accounts={accounts} />
																													<button
																															onClick={() => handleOpenModal('account')}
																															className="flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-secondary transition-colors shadow"
																													>
																															<PlusIcon className="w-5 h-5" />
																															<span>Nueva Cuenta</span>
																													</button>
																																											<button
																																													onClick={() => setShowAllAccounts(!showAllAccounts)}
																																													className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors shadow"
																																											>
																																													{showAllAccounts ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
																																													<span>{showAllAccounts ? "Mostrar Paginado" : "Mostrar Todo"}</span>
																																											</button>																												</div>                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar cuenta por nombre..."
                                value={accountSearchTerm}
                                onChange={(e) => setAccountSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <AccountsTable
                            accounts={sortedAndFilteredAccounts}
                            onSelectAccount={setSelectedAccountId}
                            onEditAccount={handleEditAccount}
                            onDeleteAccount={handleDeleteAccount}
                            selectedAccountId={selectedAccountId}
                            onReorderAccounts={handleReorderAccounts}
                            onSort={handleSortAccounts}
                            sortConfig={accountSortConfig}
                            calculateSummary={calculateAccountSummary}
                            showAll={showAllAccounts}
                        />
                    </div>
                    <div>
                        <AccountDetail
                            account={processedSelectedAccount}
                            onAddTransaction={handleAddTransactionClick}
                            onEditTransaction={handleEditTransaction}
                            onDeleteTransaction={handleDeleteTransaction}
                            onReorderTransactions={handleReorderTransactions as any}
                            onSearchTransactions={setTransactionSearchTerm}
                            transactionSearchTerm={transactionSearchTerm}
                        />
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={modalContent === 'account' 
                    ? (accountToEdit ? 'Editar Cuenta' : 'Crear Nueva Cuenta') 
                    : (transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción')}
            >
                {modalContent === 'account' && (
                    <AccountForm
                        onSubmit={accountToEdit ? handleUpdateAccount : handleAddAccount}
                        onClose={handleCloseModal}
                        accountToEdit={accountToEdit}
                    />
                )}
                {modalContent === 'transaction' && (
                    <TransactionForm
                        onSubmit={handleAddOrUpdateTransaction}
                        onClose={handleCloseModal}
                        transactionType={transactionTypeForForm}
                        transactionToEdit={transactionToEdit}
                    />
                )}
            </Modal>
        </div>
    );
};

export default App;