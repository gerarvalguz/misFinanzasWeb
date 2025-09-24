
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
}

export interface Account {
  id: string;
  name: string;
  transactions: Transaction[];
}
