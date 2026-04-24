'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

type PropertyType = 'residential' | 'commercial' | 'plot' | 'under_construction';

interface Loan {
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string | null;
  pre_emi: boolean;
}

interface CashflowSchedule {
  name: string;
  amount: number;
  frequency: string;
  start_date: string | null;
  end_date: string | null;
  is_income: boolean;
}

interface Event {
  event_type: string;
  event_date: string | null;
  description: string | null;
}

interface Property {
  id: number;
  name: string;
  property_type: PropertyType;
  purchase_date: string | null;
  possession_date: string | null;
  purchase_price: number;
  current_valuation: number;
  is_primary_residence: boolean;
  loan: Loan | null;
  cashflow_schedules: CashflowSchedule[];
  events: Event[];
}

interface CashflowRow {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  start_date: string;
}

interface FormData {
  name: string;
  property_type: PropertyType;
  purchase_date: string;
  possession_date: string;
  purchase_price: number;
  current_valuation: number;
  is_primary_residence: boolean;
  loan_principal: number;
  loan_interest_rate: number;
  loan_tenure_months: number;
  loan_emi_amount: number;
  loan_start_date: string;
  has_loan: boolean;
  incomes: CashflowRow[];
  expenses: CashflowRow[];
}

const createEmptyCashflowRow = (): CashflowRow => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  amount: 0,
  frequency: 'monthly',
  start_date: '',
});

const initialFormData: FormData = {
  name: '',
  property_type: 'residential',
  purchase_date: '',
  possession_date: '',
  purchase_price: 0,
  current_valuation: 0,
  is_primary_residence: false,
  loan_principal: 0,
  loan_interest_rate: 0,
  loan_tenure_months: 0,
  loan_emi_amount: 0,
  loan_start_date: '',
  has_loan: false,
  incomes: [createEmptyCashflowRow()],
  expenses: [createEmptyCashflowRow()],
};

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('view');
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('http://localhost:8000/properties/');
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const addIncomeRow = () => {
    setFormData({ ...formData, incomes: [...formData.incomes, createEmptyCashflowRow()] });
  };

  const removeIncomeRow = (id: string) => {
    if (formData.incomes.length > 1) {
      setFormData({ ...formData, incomes: formData.incomes.filter((r) => r.id !== id) });
    }
  };

  const updateIncomeRow = (id: string, field: keyof CashflowRow, value: string | number) => {
    setFormData({
      ...formData,
      incomes: formData.incomes.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    });
  };

  const addExpenseRow = () => {
    setFormData({ ...formData, expenses: [...formData.expenses, createEmptyCashflowRow()] });
  };

  const removeExpenseRow = (id: string) => {
    if (formData.expenses.length > 1) {
      setFormData({ ...formData, expenses: formData.expenses.filter((r) => r.id !== id) });
    }
  };

  const updateExpenseRow = (id: string, field: keyof CashflowRow, value: string | number) => {
    setFormData({
      ...formData,
      expenses: formData.expenses.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const propertyData: any = {
      name: formData.name,
      property_type: formData.property_type,
      purchase_date: formData.purchase_date || null,
      possession_date: formData.possession_date || null,
      purchase_price: formData.purchase_price,
      current_valuation: formData.current_valuation,
      is_primary_residence: formData.is_primary_residence,
    };

    if (formData.has_loan && formData.loan_principal > 0) {
      propertyData.loan = {
        principal: formData.loan_principal,
        interest_rate: formData.loan_interest_rate,
        tenure_months: formData.loan_tenure_months,
        emi_amount: formData.loan_emi_amount,
        start_date: formData.loan_start_date || null,
        pre_emi: false,
      };
    }

    propertyData.cashflow_schedules = [];

    formData.incomes.forEach((inc) => {
      if (inc.name && inc.amount > 0) {
        propertyData.cashflow_schedules.push({
          name: inc.name,
          amount: inc.amount,
          frequency: inc.frequency,
          start_date: inc.start_date || null,
          end_date: null,
          is_income: true,
        });
      }
    });

    formData.expenses.forEach((exp) => {
      if (exp.name && exp.amount > 0) {
        propertyData.cashflow_schedules.push({
          name: exp.name,
          amount: exp.amount,
          frequency: exp.frequency,
          start_date: exp.start_date || null,
          end_date: null,
          is_income: false,
        });
      }
    });

    try {
      const url = editingPropertyId 
        ? `http://localhost:8000/properties/${editingPropertyId}`
        : 'http://localhost:8000/properties/';
      const method = editingPropertyId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });

      if (res.ok) {
        setFormData({
          ...initialFormData,
          incomes: [createEmptyCashflowRow()],
          expenses: [createEmptyCashflowRow()],
        });
        setEditingPropertyId(null);
        fetchProperties();
        setActiveTab('view');
      }
    } catch (err) {
      console.error('Failed to create property:', err);
    }

    setLoading(false);
  };

  const handleEdit = (property: Property) => {
    const incomes: CashflowRow[] = [];
    const expenses: CashflowRow[] = [];

    (property.cashflow_schedules || []).forEach((cf) => {
      if (cf.is_income) {
        incomes.push({
          id: Math.random().toString(36).substr(2, 9),
          name: cf.name,
          amount: cf.amount,
          frequency: cf.frequency,
          start_date: cf.start_date || '',
        });
      } else {
        expenses.push({
          id: Math.random().toString(36).substr(2, 9),
          name: cf.name,
          amount: cf.amount,
          frequency: cf.frequency,
          start_date: cf.start_date || '',
        });
      }
    });

    if (incomes.length === 0) incomes.push(createEmptyCashflowRow());
    if (expenses.length === 0) expenses.push(createEmptyCashflowRow());

    setFormData({
      name: property.name,
      property_type: property.property_type,
      purchase_date: property.purchase_date || '',
      possession_date: property.possession_date || '',
      purchase_price: property.purchase_price,
      current_valuation: property.current_valuation,
      is_primary_residence: property.is_primary_residence,
      loan_principal: property.loan?.principal || 0,
      loan_interest_rate: property.loan?.interest_rate || 0,
      loan_tenure_months: property.loan?.tenure_months || 0,
      loan_emi_amount: property.loan?.emi_amount || 0,
      loan_start_date: property.loan?.start_date || '',
      has_loan: !!property.loan,
      incomes,
      expenses,
    });
    setEditingPropertyId(property.id);
    setActiveTab('add');
  };

  const handleDelete = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (err) {
      console.error('Failed to delete property:', err);
    }
    setLoading(false);
  };

  const generateProjectionData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    const startYear = new Date().getFullYear();

    for (let i = 0; i < 180; i++) {
      const year = Math.floor(i / 12);
      const month = months[i % 12];
      const label = `${month} ${startYear + year}`;

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalIncome = 0;
      let totalExpenses = 0;
      let cashInHand = 0;

      properties.forEach((p) => {
        const purchaseDate = p.purchase_date ? new Date(p.purchase_date) : null;
        const monthsSincePurchase = purchaseDate ? Math.floor((new Date().getTime() - purchaseDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0;
        
        if (i >= monthsSincePurchase || !purchaseDate) {
          const appreciation = p.current_valuation * 0.05 * (i / 180);
          totalAssets += p.current_valuation + appreciation;
        }

        if (p.loan && p.loan.principal > 0) {
          const loanStart = p.loan.start_date ? new Date(p.loan.start_date) : null;
          const monthsSinceLoan = loanStart ? Math.floor((new Date().getTime() - loanStart.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0;
          
          if (i >= monthsSinceLoan) {
            const remainingMonths = p.loan.tenure_months - (i - monthsSinceLoan);
            if (remainingMonths > 0) {
              totalLiabilities += p.loan.principal * (remainingMonths / p.loan.tenure_months);
            }
          }
        }

        const cashflows = p.cashflow_schedules || [];
        cashflows.forEach((cf) => {
          const cfStart = cf.start_date ? new Date(cf.start_date) : null;
          const monthsSinceCf = cfStart ? Math.floor((new Date().getTime() - cfStart.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0;
          
          if (i >= monthsSinceCf || !cfStart) {
            if (cf.is_income) {
              totalIncome += cf.amount;
            } else {
              totalExpenses += cf.amount;
            }
          }
        });
      });

      cashInHand += totalIncome - totalExpenses;

      if (i % 6 === 0) {
        data.push({
          name: label,
          assets: Math.round(totalAssets),
          liabilities: Math.round(totalLiabilities),
          income: Math.round(totalIncome),
          expenses: Math.round(totalExpenses),
          netWorth: Math.round(totalAssets - totalLiabilities),
          cashInHand: Math.round(cashInHand),
        });
      }
    }

    return data;
  };

  const projectionData = generateProjectionData();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Financial Monitor</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            View Dashboard
          </button>
          <button
            onClick={() => {
              setFormData({
                ...initialFormData,
                incomes: [createEmptyCashflowRow()],
                expenses: [createEmptyCashflowRow()],
              });
              setEditingPropertyId(null);
              setActiveTab('add');
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {editingPropertyId ? 'Edit Property' : 'Add Property'}
          </button>
        </div>

        {activeTab === 'add' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                    <select
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="plot">Plot</option>
                      <option value="under_construction">Under Construction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Possession Date</label>
                    <input
                      type="date"
                      value={formData.possession_date}
                      onChange={(e) => setFormData({ ...formData, possession_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                    <input
                      type="number"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Valuation</label>
                    <input
                      type="number"
                      value={formData.current_valuation}
                      onChange={(e) => setFormData({ ...formData, current_valuation: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_primary_residence}
                      onChange={(e) => setFormData({ ...formData, is_primary_residence: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Primary Residence</label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={formData.has_loan}
                    onChange={(e) => setFormData({ ...formData, has_loan: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Has Loan</label>
                </div>
                {formData.has_loan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Principal Amount</label>
                      <input
                        type="number"
                        value={formData.loan_principal}
                        onChange={(e) => setFormData({ ...formData, loan_principal: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.loan_interest_rate}
                        onChange={(e) => setFormData({ ...formData, loan_interest_rate: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenure (Months)</label>
                      <input
                        type="number"
                        value={formData.loan_tenure_months}
                        onChange={(e) => setFormData({ ...formData, loan_tenure_months: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">EMI Amount</label>
                      <input
                        type="number"
                        value={formData.loan_emi_amount}
                        onChange={(e) => setFormData({ ...formData, loan_emi_amount: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={formData.loan_start_date}
                        onChange={(e) => setFormData({ ...formData, loan_start_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Cashflow - Income</h2>
                  <button
                    type="button"
                    onClick={addIncomeRow}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Income
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.incomes.map((inc, index) => (
                    <div key={inc.id} className="flex gap-2 items-end">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name (e.g., Rent)</label>
                          <input
                            type="text"
                            value={inc.name}
                            onChange={(e) => updateIncomeRow(inc.id, 'name', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount</label>
                          <input
                            type="number"
                            value={inc.amount}
                            onChange={(e) => updateIncomeRow(inc.id, 'amount', Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Frequency</label>
                          <select
                            value={inc.frequency}
                            onChange={(e) => updateIncomeRow(inc.id, 'frequency', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Start Date</label>
                          <input
                            type="date"
                            value={inc.start_date}
                            onChange={(e) => updateIncomeRow(inc.id, 'start_date', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                      </div>
                      {formData.incomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIncomeRow(inc.id)}
                          className="px-2 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Cashflow - Expenses</h2>
                  <button
                    type="button"
                    onClick={addExpenseRow}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    + Add Expense
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.expenses.map((exp, index) => (
                    <div key={exp.id} className="flex gap-2 items-end">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name (e.g., Maintenance)</label>
                          <input
                            type="text"
                            value={exp.name}
                            onChange={(e) => updateExpenseRow(exp.id, 'name', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount</label>
                          <input
                            type="number"
                            value={exp.amount}
                            onChange={(e) => updateExpenseRow(exp.id, 'amount', Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Frequency</label>
                          <select
                            value={exp.frequency}
                            onChange={(e) => updateExpenseRow(exp.id, 'frequency', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Start Date</label>
                          <input
                            type="date"
                            value={exp.start_date}
                            onChange={(e) => updateExpenseRow(exp.id, 'start_date', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                      </div>
                      {formData.expenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExpenseRow(exp.id)}
                          className="px-2 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity50"
              >
                {loading ? 'Saving...' : (editingPropertyId ? 'Update Property' : 'Save Property')}
              </button>
              {editingPropertyId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...initialFormData,
                      incomes: [createEmptyCashflowRow()],
                      expenses: [createEmptyCashflowRow()],
                    });
                    setEditingPropertyId(null);
                    setActiveTab('view');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 ml-2"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No properties yet. Click &quot;Add Property&quot; to get started.
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Properties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{p.name}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">{p.property_type.replace('_', ' ')}</p>
                        <p className="text-sm">Valuation: ₹{p.current_valuation.toLocaleString()}</p>
                        {p.loan && <p className="text-sm">Loan: ₹{p.loan.principal.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Assets vs Liabilities Over Time</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="assets" stackId="1" stroke="#22c55e" fill="#22c55e" name="Assets" />
                        <Area type="monotone" dataKey="liabilities" stackId="2" stroke="#ef4444" fill="#ef4444" name="Liabilities" />
                        <Line type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} name="Net Worth" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Cashflow - Income vs Expenses Over Time</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="income" stackId="1" stroke="#22c55e" fill="#22c55e" name="Income" />
                        <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" name="Expenses" />
                        <Line type="monotone" dataKey="cashInHand" stroke="#3b82f6" strokeWidth={2} name="Cash in Hand" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}