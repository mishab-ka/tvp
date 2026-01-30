import React, { useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { ACCOUNT_OPTIONS, getAccountLabel } from '../../../utils/accounts';

const FinancialsTab = ({ financialData, onTransactionAdd, onTransactionUpdate }) => {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const getDefaultTransaction = () => ({
    type: 'deposit',
    account: '',
    amount: '',
    description: '',
    date: new Date()?.toISOString()?.split('T')?.[0]
  });

  const [newTransaction, setNewTransaction] = useState(() => getDefaultTransaction());

  const totalCollectedByAccount = useMemo(() => {
    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    (financialData?.transactions ?? []).forEach((t) => {
      const key = t?.account && totals[t.account] !== undefined ? t.account : 'letzryd';
      if (t?.type === 'deposit') totals[key] += Number(t?.amount) || 0;
    });
    return totals;
  }, [financialData?.transactions]);

  const amountNum = Number(newTransaction?.amount);
  const isFormValid = Boolean(
    newTransaction?.account &&
    (editingTransaction ? amountNum >= 0 : amountNum > 0) &&
    (newTransaction?.description?.trim() ?? '')
  );

  const handleAddTransaction = () => {
    if (!isFormValid) return;
    const transaction = {
      ...newTransaction,
      id: `TXN${String(financialData?.transactions?.length + 1)?.padStart(4, '0')}`,
      amount: parseFloat(newTransaction?.amount),
      account: newTransaction?.account || 'letzryd',
      timestamp: new Date()?.toISOString(),
      status: 'completed'
    };
    onTransactionAdd(transaction);
    setNewTransaction(getDefaultTransaction());
    setShowAddTransaction(false);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction?.id);
    setNewTransaction({
      type: transaction?.type,
      account: transaction?.account || 'letzryd',
      amount: transaction?.amount?.toString(),
      description: transaction?.description,
      date: transaction?.date
    });
  };

  const handleUpdateTransaction = () => {
    if (!isFormValid) return;
    const updatedTransaction = {
      ...newTransaction,
      amount: parseFloat(newTransaction?.amount),
      account: newTransaction?.account || 'letzryd'
    };
    onTransactionUpdate(editingTransaction, updatedTransaction);
    setEditingTransaction(null);
    setNewTransaction(getDefaultTransaction());
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return 'ArrowDownCircle';
      case 'withdrawal': return 'ArrowUpCircle';
      case 'penalty': return 'AlertTriangle';
      case 'adjustment': return 'Edit';
      default: return 'DollarSign';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit': return 'text-success';
      case 'withdrawal': return 'text-error';
      case 'penalty': return 'text-warning';
      case 'adjustment': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getAmountDisplay = (type, amount) => {
    const prefix = type === 'deposit' ? '+' : '-';
    return `${prefix}$${amount?.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Account totals (total collected per account) */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Amount collected by account</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Building2" size={16} className="text-primary" />
              <span className="text-sm font-medium text-card-foreground">LetzRyd A/c</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(totalCollectedByAccount?.letzryd ?? 0)?.toLocaleString()}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Car" size={16} className="text-primary" />
              <span className="text-sm font-medium text-card-foreground">Tawaaq Fleet A/c</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(totalCollectedByAccount?.tawaaq_fleet ?? 0)?.toLocaleString()}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Wallet" size={16} className="text-primary" />
              <span className="text-sm font-medium text-card-foreground">Cash In hand</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(totalCollectedByAccount?.cash_in_hand ?? 0)?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="DollarSign" size={16} className="text-success" />
            <span className="text-sm font-medium text-card-foreground">Total Deposits</span>
          </div>
          <div className="text-2xl font-bold text-success">${financialData?.totalDeposits?.toLocaleString()}</div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="AlertCircle" size={16} className="text-warning" />
            <span className="text-sm font-medium text-card-foreground">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-warning">${financialData?.outstandingBalance?.toLocaleString()}</div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="TrendingUp" size={16} className="text-primary" />
            <span className="text-sm font-medium text-card-foreground">Monthly Earnings</span>
          </div>
          <div className="text-2xl font-bold text-primary">${financialData?.monthlyEarnings?.toLocaleString()}</div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="CreditCard" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-card-foreground">Available Balance</span>
          </div>
          <div className="text-2xl font-bold text-foreground">${financialData?.availableBalance?.toLocaleString()}</div>
        </div>
      </div>
      {/* Transaction Management */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-card-foreground">Transaction History</h3>
            <Button
              variant="default"
              onClick={() => {
                setNewTransaction(getDefaultTransaction());
                setShowAddTransaction(true);
                setEditingTransaction(null);
              }}
              iconName="Plus"
              iconPosition="left"
              iconSize={16}
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Add/Edit Transaction Form */}
        {(showAddTransaction || editingTransaction) && (
          <div className="p-6 border-b border-border bg-muted">
            <h4 className="text-md font-medium text-foreground mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <select
                  value={newTransaction?.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e?.target?.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="penalty">Penalty</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              
              <Select
                label="Account"
                required
                options={ACCOUNT_OPTIONS}
                value={newTransaction?.account ?? ''}
                onChange={(v) => setNewTransaction(prev => ({ ...prev, account: v ?? '' }))}
                placeholder="Select account"
              />
              
              <Input
                label="Amount"
                type="number"
                value={newTransaction?.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e?.target?.value }))}
                placeholder="0.00"
              />
              
              <Input
                label="Date"
                type="date"
                value={newTransaction?.date}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e?.target?.value }))}
              />
              
              <Input
                label="Description"
                type="text"
                value={newTransaction?.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e?.target?.value }))}
                placeholder="Transaction description"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTransaction(false);
                  setEditingTransaction(null);
                  setNewTransaction(getDefaultTransaction());
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
                disabled={!isFormValid}
              >
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="p-6">
          <div className="space-y-3">
            {financialData?.transactions?.map((transaction) => (
              <div key={transaction?.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full bg-background flex items-center justify-center ${getTransactionColor(transaction?.type)}`}>
                    <Icon name={getTransactionIcon(transaction?.type)} size={16} />
                  </div>
                  
                  <div>
                    <div className="font-medium text-foreground">{transaction?.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction?.date} • {transaction?.type?.charAt(0)?.toUpperCase() + transaction?.type?.slice(1)}
                      {transaction?.account && (
                        <span className="ml-1">• {getAccountLabel(transaction.account)}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`text-lg font-semibold ${getTransactionColor(transaction?.type)}`}>
                    {getAmountDisplay(transaction?.type, transaction?.amount)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTransaction(transaction)}
                    iconName="Edit"
                    iconSize={14}
                  >
                    <span className="sr-only">Edit transaction</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {financialData?.transactions?.length === 0 && (
            <div className="text-center py-8">
              <Icon name="Receipt" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No transactions yet</h4>
              <p className="text-muted-foreground mb-4">Start by adding the first transaction for this TVP owner.</p>
              <Button
                variant="default"
                onClick={() => {
                  setNewTransaction(getDefaultTransaction());
                  setShowAddTransaction(true);
                  setEditingTransaction(null);
                }}
                iconName="Plus"
                iconPosition="left"
                iconSize={16}
              >
                Add First Transaction
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Payment Schedule */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Upcoming Payments</h3>
        
        <div className="space-y-3">
          {financialData?.upcomingPayments?.map((payment) => (
            <div key={payment?.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name="Calendar" size={16} className="text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">{payment?.description}</div>
                  <div className="text-sm text-muted-foreground">Due: {payment?.dueDate}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-foreground">${payment?.amount?.toLocaleString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment?.status === 'pending' ? 'bg-warning text-warning-foreground' : 
                  payment?.status === 'overdue' ? 'bg-error text-error-foreground' : 
                  'bg-success text-success-foreground'
                }`}>
                  {payment?.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialsTab;