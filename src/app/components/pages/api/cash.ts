  export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    paymentMethod: string;
    date: string;
    category: string;
  }

  export interface SelectOption {
    label: string;
    value: string;
  }