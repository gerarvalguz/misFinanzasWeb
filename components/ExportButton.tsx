import React from 'react';
import * as XLSX from 'xlsx';
import { Account, TransactionType } from '../types';
import { DocumentArrowDownIcon } from './icons';

interface ExportButtonProps {
  accounts: Account[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ accounts }) => {
  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Cuentas Sheet
    const accountsData = accounts.map(account => {
      const income = account.transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = account.transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expense;
      return {
        Cuenta: account.name,
        Ingresos: income,
        Gastos: expense,
        Balance: balance,
      };
    });
    const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
    XLSX.utils.book_append_sheet(wb, wsAccounts, 'Cuentas');

    // Transaction Sheets for each account
    accounts.forEach(account => {
      let runningBalance = 0;
      const transactionsData = account.transactions.map(t => {
        if (t.type === TransactionType.INCOME) {
          runningBalance += t.amount;
        } else {
          runningBalance -= t.amount;
        }
        return {
          Transacción: t.description,
          Saldo: runningBalance,
        };
      });
      const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
      // Sanitize sheet name
      const sheetName = account.name.replace(/[*?:[\]/\\]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsTransactions, sheetName);
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis-finanzas.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportToXLSX}
      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow"
    >
      <DocumentArrowDownIcon className="w-5 h-5" />
      <span>Exportar a Excel</span>
    </button>
  );
};

export default ExportButton;
