'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

type PropertyType = 'residential' | 'commercial' | 'plot';

type PropertyStatus = 'ready_to_move_in' | 'under_construction';

type PaidBy = 'individual' | 'bank';

type OtherAssetType = 'bank_account' | 'ppf' | 'epf' | 'stocks' | 'mutual_fund';

type OtherLiabilityType = 'personal_loan' | 'deposits';

interface OtherAsset {
  id: string;
  asset_type: OtherAssetType | '';
  name: string;
  amount: number;
  return_rate: number;
  included: boolean;
  is_liquid: boolean;
}

interface OtherLiability {
  id: string;
  liability_type: OtherLiabilityType | '';
  name: string;
  amount: number;
  interest_rate: number;
  included: boolean;
}

interface Loan {
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string | null;
  pre_emi: boolean;
  overdraft_account: {
    overdraft_amount: number;
    impact_type: string;
  } | null;
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

interface InstallmentDetail {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid_by: PaidBy;
  is_interest: boolean;
  is_completed: boolean;
}

interface OtherExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid_by: PaidBy;
  is_completed: boolean;
}

interface Property {
  id: number;
  name: string;
  property_type: PropertyType;
  property_status: PropertyStatus;
  purchase_date: string | null;
  possession_date: string | null;
  purchase_price: number;
  current_valuation: number;
  appreciation_rate: number;
  is_primary_residence: boolean;
  last_updated: string | null;
  loan: Loan | null;
  cashflow_schedules: CashflowSchedule[];
  events: Event[];
  installments: InstallmentDetail[];
  other_expenses: OtherExpense[];
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
  property_status: PropertyStatus;
  purchase_date: string;
  possession_date: string;
  purchase_price: number;
  current_valuation: number;
  appreciation_rate: number;
  is_primary_residence: boolean;
  loan_principal: number;
  loan_interest_rate: number;
  loan_tenure_months: number;
  loan_emi_amount: number;
  loan_start_date: string;
  has_loan: boolean;
  has_overdraft: boolean;
  overdraft_amount: number;
  overdraft_impact_type: string;
  incomes: CashflowRow[];
  expenses: CashflowRow[];
  installments: InstallmentDetail[];
  other_expenses: OtherExpense[];
}

const createEmptyCashflowRow = (): CashflowRow => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  amount: 0,
  frequency: 'monthly',
  start_date: '',
});

const createEmptyInstallment = (): InstallmentDetail => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  amount: 0,
  date: '',
  paid_by: 'individual',
  is_interest: false,
  is_completed: false,
});

const createEmptyOtherExpense = (): OtherExpense => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  amount: 0,
  date: '',
  paid_by: 'individual',
  is_completed: false,
});

const initialFormData: FormData = {
  name: '',
  property_type: 'residential',
  property_status: 'ready_to_move_in',
  purchase_date: '',
  possession_date: '',
  purchase_price: 0,
  current_valuation: 0,
  appreciation_rate: 0,
  is_primary_residence: false,
  loan_principal: 0,
  loan_interest_rate: 0,
  loan_tenure_months: 0,
  loan_emi_amount: 0,
  loan_start_date: '',
  has_loan: false,
  has_overdraft: false,
  overdraft_amount: 0,
  overdraft_impact_type: 'reduce_emi',
  incomes: [createEmptyCashflowRow()],
  expenses: [createEmptyCashflowRow()],
  installments: [createEmptyInstallment()],
  other_expenses: [createEmptyOtherExpense()],
};

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('view');
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [timelineMonths, setTimelineMonths] = useState<number>(120);
  const [customMonths, setCustomMonths] = useState<string>('120');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [excludedPropertyIds, setExcludedPropertyIds] = useState<number[]>([]);
  const [deleteConfirmProperty, setDeleteConfirmProperty] = useState<{id: number; name: string} | null>(null);
  const [otherAssets, setOtherAssets] = useState<OtherAsset[]>([
    { id: '1', asset_type: 'bank_account', name: 'Bank Account', amount: 0, return_rate: 4, included: true, is_liquid: true },
    { id: '2', asset_type: 'ppf', name: 'PPF', amount: 0, return_rate: 7, included: true, is_liquid: false },
    { id: '3', asset_type: 'epf', name: 'EPF', amount: 0, return_rate: 8, included: true, is_liquid: false },
    { id: '4', asset_type: 'stocks', name: 'Stocks', amount: 0, return_rate: 10, included: true, is_liquid: true },
    { id: '5', asset_type: 'mutual_fund', name: 'Mutual Fund', amount: 0, return_rate: 12, included: true, is_liquid: true },
  ]);
  const [otherLiabilities, setOtherLiabilities] = useState<OtherLiability[]>([
    { id: '1', liability_type: 'personal_loan', name: 'Personal Loan', amount: 0, interest_rate: 10, included: true },
    { id: '2', liability_type: 'deposits', name: 'Deposits', amount: 0, interest_rate: 6, included: true },
  ]);
  const [showOtherAssetsModal, setShowOtherAssetsModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showIncomeExpenseModal, setShowIncomeExpenseModal] = useState(false);
  const [showLoanConfigModal, setShowLoanConfigModal] = useState(false);
  const [modalIncomes, setModalIncomes] = useState<CashflowRow[]>([]);
  const [modalExpenses, setModalExpenses] = useState<CashflowRow[]>([]);
  
  const [loanConfig, setLoanConfig] = useState({
    principalAmount: 0,
    interestRate: 0,
    tenureMonths: 0,
    startDate: '',
    isOverdraftLinked: false,
    overdraftCashAmount: 0,
    impactType: 'EMI' as 'EMI' | 'TENURE',
    emiAmount: 0,
    installments: [] as InstallmentDetail[],
  });

  const [modalInstallments, setModalInstallments] = useState<InstallmentDetail[]>([]);
  const [isPreEMIMode, setIsPreEMIMode] = useState(false);

  useEffect(() => {
    if (loanConfig.principalAmount > 0 && loanConfig.interestRate > 0 && loanConfig.tenureMonths > 0) {
      let emi = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths);
      
      if (loanConfig.isOverdraftLinked && loanConfig.overdraftCashAmount > 0) {
        if (loanConfig.impactType === 'EMI') {
          emi = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths, loanConfig.overdraftCashAmount, 'EMI');
        } else {
          const { adjustedTenure } = calculateEMIWithOverdraftTenure(
            loanConfig.principalAmount,
            loanConfig.interestRate,
            loanConfig.tenureMonths,
            loanConfig.overdraftCashAmount
          );
          emi = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, adjustedTenure);
        }
      }
      
      setLoanConfig(prev => ({ ...prev, emiAmount: emi }));
    } else {
      setLoanConfig(prev => ({ ...prev, emiAmount: 0 }));
    }
  }, [loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths, loanConfig.isOverdraftLinked, loanConfig.overdraftCashAmount, loanConfig.impactType]);

  useEffect(() => {
    if (isPreEMIMode && modalInstallments.length > 0) {
      const preEMI = calculatePreEMI();
      setLoanConfig(prev => ({ ...prev, emiAmount: preEMI }));
    }
  }, [modalInstallments, loanConfig.isOverdraftLinked, loanConfig.overdraftCashAmount, loanConfig.principalAmount, loanConfig.interestRate, isPreEMIMode]);

  const calculateEMI = (principal: number, annualRate: number, tenure: number, overdraftAmount: number = 0, impactType: 'EMI' | 'TENURE' = 'EMI'): number => {
    if (principal <= 0 || annualRate <= 0 || tenure <= 0) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    let effectivePrincipal = principal;
    
    if (overdraftAmount > 0 && impactType === 'EMI') {
      effectivePrincipal = Math.max(0, principal - overdraftAmount);
    }
    
    if (effectivePrincipal <= 0) return 0;
    
    const emi = effectivePrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi * 100) / 100;
  };

  const calculateEMIWithOverdraftTenure = (principal: number, annualRate: number, tenure: number, overdraftAmount: number): { adjustedTenure: number; adjustedEMI: number } => {
    if (principal <= 0 || annualRate <= 0 || tenure <= 0 || overdraftAmount <= 0) {
      return { adjustedTenure: tenure, adjustedEMI: 0 };
    }
    
    const monthlyRate = annualRate / 100 / 12;
    const fullEMI = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const interestPortion = principal * monthlyRate;
    const principalPortion = fullEMI - interestPortion;
    const monthsCoveredByOverdraft = overdraftAmount / principalPortion;
    const adjustedTenure = Math.max(1, Math.round(tenure - monthsCoveredByOverdraft));
    
    const adjustedEMI = calculateEMI(principal, annualRate, adjustedTenure);
    
    return { adjustedTenure, adjustedEMI };
  };

  const calculatePreEMI = (): number => {
    const today = new Date();
    const bankDisbursedInstallments = modalInstallments.filter(inst => 
      inst.paid_by === 'bank' && 
      !inst.is_completed &&
      new Date(inst.date) <= today
    );
    
    let bankInstallmentSum = 0;
    for (const inst of bankDisbursedInstallments) {
      if (inst.is_interest) {
        const principal = loanConfig.principalAmount;
        const monthlyRate = loanConfig.interestRate / 100 / 12;
        const interestAmount = principal * monthlyRate;
        bankInstallmentSum += interestAmount;
      } else {
        bankInstallmentSum += inst.amount;
      }
    }
    
    const monthlyRate = loanConfig.interestRate / 100 / 12;
    const preEMI = Math.max(0, bankInstallmentSum - loanConfig.overdraftCashAmount) * monthlyRate;
    
    return Math.round(preEMI * 100) / 100;
  };

  const handleHasLoanChange = (checked: boolean) => {
    if (!checked) {
      setLoanConfig({
        principalAmount: 0,
        interestRate: 0,
        tenureMonths: 0,
        startDate: '',
        isOverdraftLinked: false,
        overdraftCashAmount: 0,
        impactType: 'EMI',
        emiAmount: 0,
        installments: [],
      });
    }
    setFormData({ ...formData, has_loan: checked });
  };

  const handleOpenLoanConfig = () => {
    const isUnderConstruction = formData.property_status === 'under_construction';
    setIsPreEMIMode(isUnderConstruction);
    setLoanConfig({
      principalAmount: formData.loan_principal || 0,
      interestRate: formData.loan_interest_rate || 0,
      tenureMonths: formData.loan_tenure_months || 0,
      startDate: formData.loan_start_date || '',
      isOverdraftLinked: formData.has_overdraft || false,
      overdraftCashAmount: formData.overdraft_amount || 0,
      impactType: formData.overdraft_impact_type === 'reduce_tenure' ? 'TENURE' : 'EMI',
      emiAmount: formData.loan_emi_amount || 0,
      installments: formData.installments || [],
    });
    setModalInstallments(formData.installments && formData.installments.length > 0 
      ? [...formData.installments] 
      : [createEmptyInstallment()]);
    setShowLoanConfigModal(true);
  };

  const handleSaveLoanConfig = () => {
    let calculatedEMI = loanConfig.emiAmount;
    
    if (isPreEMIMode) {
      calculatedEMI = calculatePreEMI();
    } else if (loanConfig.principalAmount > 0 && loanConfig.interestRate > 0 && loanConfig.tenureMonths > 0) {
      if (loanConfig.isOverdraftLinked && loanConfig.overdraftCashAmount > 0 && loanConfig.impactType === 'EMI') {
        calculatedEMI = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths, loanConfig.overdraftCashAmount, 'EMI');
      } else if (loanConfig.isOverdraftLinked && loanConfig.overdraftCashAmount > 0 && loanConfig.impactType === 'TENURE') {
        const fullEMI = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths);
        calculatedEMI = fullEMI;
      } else {
        calculatedEMI = calculateEMI(loanConfig.principalAmount, loanConfig.interestRate, loanConfig.tenureMonths);
      }
    }
    
    const validInstallments = modalInstallments.filter(inst => inst.name && inst.amount > 0 && inst.date);
    
    setFormData({
      ...formData,
      loan_principal: loanConfig.principalAmount,
      loan_interest_rate: loanConfig.interestRate,
      loan_tenure_months: loanConfig.tenureMonths,
      loan_start_date: loanConfig.startDate,
      loan_emi_amount: calculatedEMI,
      has_overdraft: loanConfig.isOverdraftLinked,
      overdraft_amount: loanConfig.overdraftCashAmount,
      overdraft_impact_type: loanConfig.impactType === 'TENURE' ? 'reduce_tenure' : 'reduce_emi',
      installments: isPreEMIMode ? validInstallments : [],
    });
    setShowLoanConfigModal(false);
  };

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
      property_status: formData.property_status,
      purchase_date: formData.purchase_date || null,
      possession_date: formData.possession_date || null,
      purchase_price: formData.purchase_price,
      current_valuation: formData.current_valuation,
      appreciation_rate: formData.appreciation_rate,
      is_primary_residence: formData.is_primary_residence,
    };

    if (formData.has_loan && formData.loan_principal > 0) {
      const loanData: any = {
        principal: formData.loan_principal,
        interest_rate: formData.loan_interest_rate,
        tenure_months: formData.loan_tenure_months,
        emi_amount: formData.loan_emi_amount,
        start_date: formData.loan_start_date || null,
        pre_emi: false,
      };
      if (formData.has_overdraft && formData.overdraft_amount > 0) {
        loanData.overdraft_account = {
          overdraft_amount: formData.overdraft_amount,
          impact_type: formData.overdraft_impact_type,
        };
      }
      propertyData.loan = loanData;
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

    propertyData.installments = [];
    formData.installments.forEach((inst) => {
      if (inst.name && inst.amount > 0) {
        propertyData.installments.push({
          name: inst.name,
          amount: inst.amount,
          date: inst.date || null,
          paid_by: inst.paid_by,
          is_interest: inst.is_interest,
          is_completed: inst.is_completed,
        });
      }
    });

    propertyData.other_expenses = [];
    formData.other_expenses.forEach((exp) => {
      if (exp.name && exp.amount > 0) {
        propertyData.other_expenses.push({
          name: exp.name,
          amount: exp.amount,
          date: exp.date || null,
          paid_by: exp.paid_by,
          is_completed: exp.is_completed,
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
          installments: [createEmptyInstallment()],
          other_expenses: [createEmptyOtherExpense()],
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

    const installments = (property.installments || []).length > 0 ? property.installments : [createEmptyInstallment()];
    const otherExpenses = (property.other_expenses || []).length > 0 ? property.other_expenses : [createEmptyOtherExpense()];

    setFormData({
      name: property.name,
      property_type: property.property_type,
      property_status: property.property_status || 'ready_to_move_in',
      purchase_date: property.purchase_date || '',
      possession_date: property.possession_date || '',
      purchase_price: property.purchase_price,
      current_valuation: property.current_valuation,
      appreciation_rate: property.appreciation_rate || 0,
      is_primary_residence: property.is_primary_residence,
      loan_principal: property.loan?.principal || 0,
      loan_interest_rate: property.loan?.interest_rate || 0,
      loan_tenure_months: property.loan?.tenure_months || 0,
      loan_emi_amount: property.loan?.emi_amount || 0,
      loan_start_date: property.loan?.start_date || '',
      has_loan: !!property.loan,
      has_overdraft: !!property.loan?.overdraft_account,
      overdraft_amount: property.loan?.overdraft_account?.overdraft_amount || 0,
      overdraft_impact_type: property.loan?.overdraft_account?.impact_type || 'reduce_emi',
      incomes,
      expenses,
      installments,
      other_expenses: otherExpenses,
    });
    setEditingPropertyId(property.id);
    setActiveTab('add');
  };

  const handleDelete = async (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setDeleteConfirmProperty({ id: propertyId, name: property.name });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmProperty) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/properties/${deleteConfirmProperty.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (err) {
      console.error('Failed to delete property:', err);
    }
    setLoading(false);
    setDeleteConfirmProperty(null);
  };

  const togglePropertyInclusion = (propertyId: number) => {
    setExcludedPropertyIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const addOtherAsset = () => {
    const newAsset: OtherAsset = {
      id: Math.random().toString(36).substr(2, 9),
      asset_type: '',
      name: '',
      amount: 0,
      return_rate: 0,
      included: true,
      is_liquid: true,
    };
    setOtherAssets([...otherAssets, newAsset]);
  };

  const removeOtherAsset = (id: string) => {
    setOtherAssets(otherAssets.filter(a => a.id !== id));
  };

  const addOtherLiability = () => {
    const newLiability: OtherLiability = {
      id: Math.random().toString(36).substr(2, 9),
      liability_type: '',
      name: '',
      amount: 0,
      interest_rate: 0,
      included: true,
    };
    setOtherLiabilities([...otherLiabilities, newLiability]);
  };

  const removeOtherLiability = (id: string) => {
    setOtherLiabilities(otherLiabilities.filter(l => l.id !== id));
  };

  const generateProjectionData = (timelineMonths: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startYear = currentDate.getFullYear();
    const startMonth = currentDate.getMonth();

    let cashInHand = 0;

    let initialLiquidAssets = 0;
    const propertyValuations: Record<number, number> = {};
    const loanBalances: Record<number, number> = {};
    const otherAssetValues: Record<string, number> = {};
    otherAssets.forEach(a => {
      if (a.included && a.is_liquid) {
        initialLiquidAssets += a.amount;
        otherAssetValues[a.id] = a.amount;
      }
    });
    cashInHand += initialLiquidAssets;

    properties.forEach(p => {
      if (!excludedPropertyIds.includes(p.id) && p.loan) {
        const paidInstallments = (p.installments || []).filter(inst => inst.is_completed && inst.paid_by === 'bank').length;
        const totalDisbursed = (p.installments || []).reduce((sum, inst) => 
          inst.is_completed && inst.paid_by === 'bank' ? sum + inst.amount : sum, 0
        );
        if (totalDisbursed > 0) {
          loanBalances[p.id] = totalDisbursed;
        } else {
          loanBalances[p.id] = p.loan.principal;
        }
      }
    });

    const getMonthIndex = (date: Date) => {
      return (date.getFullYear() - startYear) * 12 + (date.getMonth() - startMonth);
    };

    for (let i = 0; i < timelineMonths; i++) {
      const projectionDate = new Date(startYear, startMonth + i, 1);
      const year = Math.floor((startMonth + i) / 12);
      const month = monthNames[(startMonth + i) % 12];
      const label = `${month} ${startYear + year}`;

      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      let monthlyAssets = 0;
      let monthlyLiabilities = 0;

      properties.forEach((p) => {
        if (excludedPropertyIds.includes(p.id)) return;

        const appreciationRate = (p.appreciation_rate || 0) / 100 / 12;
        const prevValuation = propertyValuations[p.id] || p.current_valuation;
        const newValuation = prevValuation * (1 + appreciationRate);
        propertyValuations[p.id] = newValuation;
        monthlyAssets += newValuation;

        if (p.loan && p.loan.principal > 0) {
          const loanStart = p.loan.start_date ? new Date(p.loan.start_date) : new Date(startYear, startMonth, 1);
          const possessionDate = p.possession_date ? new Date(p.possession_date) : null;
          
          const monthsSinceLoanStart = getMonthIndex(loanStart);
          const monthsUntilPossession = possessionDate ? getMonthIndex(possessionDate) - i : Infinity;
          
          const isPreEmiPeriod = possessionDate && i < monthsUntilPossession;
          const isAfterPossession = !possessionDate || i >= monthsUntilPossession;
          const isLoanActive = i >= monthsSinceLoanStart && i < monthsSinceLoanStart + p.loan.tenure_months;
          
          let currentLoanBalance = loanBalances[p.id] || p.loan.principal;
          const interestRate = p.loan.interest_rate / 100 / 12;
          
          if (isLoanActive) {
            const interestComponent = currentLoanBalance * interestRate;
            let emiAmount = p.loan.emi_amount;
            
            if (isPreEmiPeriod) {
              monthlyExpenses += interestComponent;
              monthlyLiabilities += currentLoanBalance;
            } else if (isAfterPossession) {
              let principalComponent = emiAmount - interestComponent;
              if (p.loan.overdraft_account && p.loan.overdraft_account.overdraft_amount > 0) {
                const overdraftAmt = p.loan.overdraft_account.overdraft_amount;
                const impactType = p.loan.overdraft_account.impact_type;
                
                if (impactType === 'reduce_emi') {
                  const adjustedPrincipal = Math.max(0, currentLoanBalance - overdraftAmt);
                  if (adjustedPrincipal > 0) {
                    const reducedInterest = adjustedPrincipal * interestRate;
                    const reducedPrincipal = emiAmount - reducedInterest;
                    if (reducedPrincipal > 0) {
                      principalComponent = reducedPrincipal;
                    }
                  }
                }
              }
              
              const newBalance = Math.max(0, currentLoanBalance - principalComponent);
              loanBalances[p.id] = newBalance;
              monthlyLiabilities += newBalance;
              monthlyExpenses += emiAmount;
            }
          } else if (currentLoanBalance > 0) {
            monthlyLiabilities += currentLoanBalance;
          }
        }

        const installments = p.installments || [];
        installments.forEach(inst => {
          if (!inst.date || !inst.name || inst.amount <= 0) return;
          const instDate = new Date(inst.date);
          const instMonthIndex = getMonthIndex(instDate);
          
          if (instMonthIndex === i) {
            if (inst.paid_by === 'individual') {
              if (inst.is_completed) {
                monthlyExpenses += inst.amount;
              } else {
                monthlyExpenses += 0;
              }
            } else if (inst.paid_by === 'bank') {
              if (inst.is_completed) {
                if (loanBalances[p.id] !== undefined) {
                  loanBalances[p.id] += inst.amount;
                }
              }
            }
          }
        });

        const otherExpenses = p.other_expenses || [];
        otherExpenses.forEach(exp => {
          if (!exp.date || !exp.name || exp.amount <= 0) return;
          const expDate = new Date(exp.date);
          const expMonthIndex = getMonthIndex(expDate);
          
          if (expMonthIndex === i && exp.paid_by === 'individual') {
            if (exp.is_completed) {
              monthlyExpenses += exp.amount;
            }
          }
        });

        const cashflows = p.cashflow_schedules || [];
        cashflows.forEach((cf) => {
          const cfStart = cf.start_date ? new Date(cf.start_date) : null;
          const monthsSinceCf = cfStart ? getMonthIndex(cfStart) : -1;
          
          if (i >= monthsSinceCf || !cfStart) {
            let cfAmount = cf.amount;
            if (cf.frequency === 'quarterly') {
              cfAmount = cf.amount / 3;
            } else if (cf.frequency === 'yearly') {
              cfAmount = cf.amount / 12;
            }
            
            if (cf.is_income) {
              monthlyIncome += cfAmount;
            } else {
              monthlyExpenses += cfAmount;
            }
          }
        });
      });

      otherAssets.forEach(a => {
        if (a.included && otherAssetValues[a.id] !== undefined) {
          const prevValue = otherAssetValues[a.id];
          const monthlyReturn = (a.return_rate || 0) / 100 / 12;
          const newValue = prevValue * (1 + monthlyReturn);
          otherAssetValues[a.id] = newValue;
          monthlyAssets += newValue;
        }
      });

      otherLiabilities.forEach(l => {
        if (l.included && l.amount > 0) {
          const interestRate = l.interest_rate / 100 / 12;
          const interestComponent = l.amount * interestRate;
          monthlyLiabilities += l.amount;
          monthlyExpenses += interestComponent;
        }
      });

      const netMonthlyCashflow = monthlyIncome - monthlyExpenses;
      cashInHand += netMonthlyCashflow;

      data.push({
        name: label,
        assets: Math.round(monthlyAssets),
        liabilities: Math.round(monthlyLiabilities),
        principalOutstanding: Math.round(monthlyLiabilities),
        income: Math.round(monthlyIncome),
        expenses: Math.round(monthlyExpenses),
        netWorth: Math.round(monthlyAssets - monthlyLiabilities),
        cashInHand: Math.round(cashInHand),
        monthlyIncome: Math.round(monthlyIncome),
        monthlyExpenses: Math.round(monthlyExpenses),
      });
    }

    return data;
  };

  const projectionData = generateProjectionData(timelineMonths);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => { setActiveTab('view'); setEditingPropertyId(null); }}
          >
            Financial Monitor
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {activeTab === 'add' ? (
          <div className="bg-white rounded-lg shadow p-6">
            {editingPropertyId && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 font-medium">Editing Property - Make your changes below and click Update</p>
              </div>
            )}
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
                      onChange={(e) => {
                        const newType = e.target.value as PropertyType;
                        setFormData({ 
                          ...formData, 
                          property_type: newType,
                        });
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Status</label>
                    <select
                      value={formData.property_status}
                      onChange={(e) => setFormData({ ...formData, property_status: e.target.value as PropertyStatus })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="ready_to_move_in">Ready to Move In</option>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Appreciation Rate (% per year)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.appreciation_rate}
                      onChange={(e) => setFormData({ ...formData, appreciation_rate: Number(e.target.value) })}
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
                    onChange={(e) => handleHasLoanChange(e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Has Loan</label>
                </div>
                {formData.has_loan && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleOpenLoanConfig}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Configure Installments & Expenses
                    </button>
                    {formData.loan_emi_amount > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-green-800 mb-2">EMI Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Principal:</span>
                            <span className="ml-2 font-medium">₹{formData.loan_principal.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Interest Rate:</span>
                            <span className="ml-2 font-medium">{formData.loan_interest_rate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tenure:</span>
                            <span className="ml-2 font-medium">{formData.loan_tenure_months} months</span>
                          </div>
                          <div>
                            <span className="text-gray-600">EMI:</span>
                            <span className="ml-2 font-medium text-green-700">₹{formData.loan_emi_amount.toLocaleString()}</span>
                          </div>
                          {formData.has_overdraft && (
                            <>
                              <div>
                                <span className="text-gray-600">Overdraft:</span>
                                <span className="ml-2 font-medium">₹{formData.overdraft_amount.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Impact:</span>
                                <span className="ml-2 font-medium">{formData.overdraft_impact_type === 'reduce_emi' ? 'Reduced EMI' : 'Reduced Tenure'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
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

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity50"
                >
                  {loading ? 'Saving...' : (editingPropertyId ? 'Update Property' : 'Save Property')}
                </button>
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
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Properties</h2>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Add Property
                </button>
              </div>
              {properties.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No properties yet. Click &quot;Add Property&quot; to get started.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((p) => (
                    <div key={p.id} className={`border rounded-lg p-4 ${excludedPropertyIds.includes(p.id) ? 'opacity-50 bg-gray-100' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!excludedPropertyIds.includes(p.id)}
                            onChange={() => togglePropertyInclusion(p.id)}
                            className="w-4 h-4"
                          />
                          <h3 className="font-semibold">{p.name}</h3>
                        </div>
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
                      {p.last_updated && <p className="text-xs text-gray-400">Updated: {p.last_updated ? new Date(p.last_updated).toLocaleDateString() : '-'}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Assets & Liabilities</h2>
                <button
                  onClick={() => setShowOtherAssetsModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                  Manage Assets & Liabilities
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-green-700">Other Assets</h3>
                  <div className="space-y-2 text-sm">
                    {otherAssets.filter(a => a.included).map(a => (
                      <div key={a.id} className="flex justify-between">
                        <span>{a.name}{a.is_liquid ? ' 💧' : ''}</span>
                        <span className="font-medium">₹{a.amount.toLocaleString()} @ {a.return_rate}%</span>
                      </div>
                    ))}
                    {otherAssets.filter(a => a.included).length === 0 && <p className="text-gray-500">No assets included</p>}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-red-700">Other Liabilities</h3>
                  <div className="space-y-2 text-sm">
                    {otherLiabilities.filter(l => l.included).map(l => (
                      <div key={l.id} className="flex justify-between">
                        <span>{l.name}</span>
                        <span className="font-medium">₹{l.amount.toLocaleString()} @ {l.interest_rate}%</span>
                      </div>
                    ))}
                    {otherLiabilities.filter(l => l.included).length === 0 && <p className="text-gray-500">No liabilities included</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Income & Expenses</h2>
                <button
                  onClick={() => {
                    setModalIncomes(properties.length > 0 ? [...formData.incomes] : [createEmptyCashflowRow()]);
                    setModalExpenses(properties.length > 0 ? [...formData.expenses] : [createEmptyCashflowRow()]);
                    setShowIncomeExpenseModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Manage Income & Expenses
                </button>
              </div>
              <p className="text-gray-500 text-sm">Manage income and expenses across all properties.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Assets vs Liabilities Over Time</h2>
                <div className="flex gap-2 items-center">
                  {[12, 24, 120, 240].map((months) => (
                    <button
                      key={months}
                      onClick={() => { setTimelineMonths(months); setShowCustomInput(false); }}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        timelineMonths === months && !showCustomInput
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {months} months
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      showCustomInput
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom
                  </button>
                  {showCustomInput && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={customMonths}
                        onChange={(e) => setCustomMonths(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">months</span>
                      <button
                        onClick={() => {
                          const months = parseInt(customMonths);
                          if (months > 0 && months <= 600) {
                            setTimelineMonths(months);
                          }
                        }}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="assets" stackId="1" stroke="#22c55e" fill="#22c55e" name="Assets" />
                    <Area type="monotone" dataKey="principalOutstanding" stackId="2" stroke="#f59e0b" fill="#f59e0b" name="Principal Outstanding" />
                    <Line type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} name="Net Worth" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Calculation Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Assets:</span>
                    <span className="ml-2 font-medium text-green-600">₹{projectionData[0]?.assets.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Projected Assets ({timelineMonths}m):</span>
                    <span className="ml-2 font-medium text-green-600">₹{projectionData[projectionData.length - 1]?.assets.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Liabilities:</span>
                    <span className="ml-2 font-medium text-red-600">₹{projectionData[0]?.liabilities.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Projected Liabilities ({timelineMonths}m):</span>
                    <span className="ml-2 font-medium text-red-600">₹{projectionData[projectionData.length - 1]?.liabilities.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Net Worth:</span>
                    <span className="ml-2 font-medium text-blue-600">₹{projectionData[0]?.netWorth.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Projected Net Worth ({timelineMonths}m):</span>
                    <span className="ml-2 font-medium text-blue-600">₹{projectionData[projectionData.length - 1]?.netWorth.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Asset Change:</span>
                    <span className={`ml-2 font-medium ${(projectionData[projectionData.length - 1]?.assets || 0) - (projectionData[0]?.assets || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((projectionData[projectionData.length - 1]?.assets || 0) - (projectionData[0]?.assets || 0)) >= 0 ? '+' : ''}₹{((projectionData[projectionData.length - 1]?.assets || 0) - (projectionData[0]?.assets || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Liability Change:</span>
                    <span className={`ml-2 font-medium ${(projectionData[projectionData.length - 1]?.liabilities || 0) - (projectionData[0]?.liabilities || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(projectionData[projectionData.length - 1]?.liabilities || 0) <= (projectionData[0]?.liabilities || 0) ? '-' : '+'}₹{Math.abs(((projectionData[projectionData.length - 1]?.liabilities || 0) - (projectionData[0]?.liabilities || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Cashflow - Income vs Expenses Over Time</h2>
                <div className="flex gap-2 items-center">
                  {[12, 24, 120, 240].map((months) => (
                    <button
                      key={months}
                      onClick={() => { setTimelineMonths(months); setShowCustomInput(false); }}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        timelineMonths === months && !showCustomInput
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {months} months
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      showCustomInput
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom
                  </button>
                  {showCustomInput && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={customMonths}
                        onChange={(e) => setCustomMonths(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">months</span>
                      <button
                        onClick={() => {
                          const months = parseInt(customMonths);
                          if (months > 0 && months <= 600) {
                            setTimelineMonths(months);
                          }
                        }}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="monthlyIncome" stroke="#22c55e" strokeWidth={2} name="Monthly Income" dot={false} />
                    <Line type="monotone" dataKey="monthlyExpenses" stroke="#ef4444" strokeWidth={2} name="Monthly Expenses" dot={false} />
                    <Line type="monotone" dataKey="cashInHand" stroke="#3b82f6" strokeWidth={2} name="Cash in Hand" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Calculation Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Monthly Income:</span>
                    <span className="ml-2 font-medium text-green-600">₹{projectionData[0]?.monthlyIncome.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Monthly Expenses:</span>
                    <span className="ml-2 font-medium text-red-600">₹{projectionData[0]?.monthlyExpenses.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cumulative Income ({timelineMonths}m):</span>
                    <span className="ml-2 font-medium text-green-600">₹{projectionData.reduce((sum, d) => sum + d.monthlyIncome, 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cumulative Expenses ({timelineMonths}m):</span>
                    <span className="ml-2 font-medium text-red-600">₹{projectionData.reduce((sum, d) => sum + d.monthlyExpenses, 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Net Cash Flow ({timelineMonths}m):</span>
                    <span className={`ml-2 font-medium ${projectionData.reduce((sum, d) => sum + d.monthlyIncome - d.monthlyExpenses, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{projectionData.reduce((sum, d) => sum + d.monthlyIncome - d.monthlyExpenses, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cash in Hand ({timelineMonths}m):</span>
                    <span className={`ml-2 font-medium ${(projectionData[projectionData.length - 1]?.cashInHand || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{projectionData[projectionData.length - 1]?.cashInHand.toLocaleString() || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Monthly Income:</span>
                    <span className="ml-2 font-medium text-green-600">₹{projectionData.length > 0 ? Math.round(projectionData.reduce((sum, d) => sum + d.monthlyIncome, 0) / timelineMonths).toLocaleString() : 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Monthly Expenses:</span>
                    <span className="ml-2 font-medium text-red-600">₹{projectionData.length > 0 ? Math.round(projectionData.reduce((sum, d) => sum + d.monthlyExpenses, 0) / timelineMonths).toLocaleString() : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      {deleteConfirmProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Confirm Delete Property</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{deleteConfirmProperty.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmProperty(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showOtherAssetsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-purple-600 mb-4">Manage Other Assets & Liabilities</h3>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-green-700">Other Assets</h4>
                  <button
                    type="button"
                    onClick={addOtherAsset}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Asset
                  </button>
                </div>
                <div className="space-y-3">
                  {otherAssets.map((asset, index) => (
                    <div key={asset.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={asset.included}
                        onChange={(e) => {
                          const updated = [...otherAssets];
                          updated[index].included = e.target.checked;
                          setOtherAssets(updated);
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => {
                              const updated = [...otherAssets];
                              updated[index].name = e.target.value;
                              setOtherAssets(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={asset.amount}
                            onChange={(e) => {
                              const updated = [...otherAssets];
                              updated[index].amount = Number(e.target.value);
                              setOtherAssets(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Return Rate (% p.a.)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={asset.return_rate}
                            onChange={(e) => {
                              const updated = [...otherAssets];
                              updated[index].return_rate = Number(e.target.value);
                              setOtherAssets(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={asset.is_liquid}
                              onChange={(e) => {
                                const updated = [...otherAssets];
                                updated[index].is_liquid = e.target.checked;
                                setOtherAssets(updated);
                              }}
                              className="w-4 h-4"
                            />
                            Liquid
                          </label>
                        </div>
                        <div className="flex items-center justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => removeOtherAsset(asset.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-red-700">Other Liabilities</h4>
                  <button
                    type="button"
                    onClick={addOtherLiability}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    + Add Liability
                  </button>
                </div>
                <div className="space-y-3">
                  {otherLiabilities.map((liability, index) => (
                    <div key={liability.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={liability.included}
                        onChange={(e) => {
                          const updated = [...otherLiabilities];
                          updated[index].included = e.target.checked;
                          setOtherLiabilities(updated);
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={liability.name}
                            onChange={(e) => {
                              const updated = [...otherLiabilities];
                              updated[index].name = e.target.value;
                              setOtherLiabilities(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={liability.amount}
                            onChange={(e) => {
                              const updated = [...otherLiabilities];
                              updated[index].amount = Number(e.target.value);
                              setOtherLiabilities(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Interest Rate (% p.a.)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={liability.interest_rate}
                            onChange={(e) => {
                              const updated = [...otherLiabilities];
                              updated[index].interest_rate = Number(e.target.value);
                              setOtherLiabilities(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => removeOtherLiability(liability.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowOtherAssetsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowOtherAssetsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showInstallmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-purple-600 mb-4">Installment & Expense Details</h3>
              <p className="text-sm text-gray-600 mb-4">
                For under-construction properties, configure the disbursed loan installments and other expenses. 
                Payments made by the bank increase the loan principal, while individual payments reduce cash in hand.
              </p>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-blue-700">Loan Installments (Disbursements)</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        installments: [...formData.installments, createEmptyInstallment()],
                      });
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Installment
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.installments.map((inst, index) => (
                    <div key={inst.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={inst.name}
                            onChange={(e) => {
                              const updated = [...formData.installments];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, installments: updated });
                            }}
                            placeholder="e.g., 1st Disbursement"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={inst.amount}
                            onChange={(e) => {
                              const updated = [...formData.installments];
                              updated[index].amount = Number(e.target.value);
                              setFormData({ ...formData, installments: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={inst.date}
                            onChange={(e) => {
                              const updated = [...formData.installments];
                              updated[index].date = e.target.value;
                              setFormData({ ...formData, installments: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Paid By</label>
                          <select
                            value={inst.paid_by}
                            onChange={(e) => {
                              const updated = [...formData.installments];
                              updated[index].paid_by = e.target.value as PaidBy;
                              setFormData({ ...formData, installments: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="individual">Individual</option>
                            <option value="bank">Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Type</label>
                          <select
                            value={inst.is_interest ? 'interest' : 'principal'}
                            onChange={(e) => {
                              const updated = [...formData.installments];
                              updated[index].is_interest = e.target.value === 'interest';
                              setFormData({ ...formData, installments: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="principal">Principal</option>
                            <option value="interest">Interest (Pre-EMI)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inst.is_completed}
                              onChange={(e) => {
                                const updated = [...formData.installments];
                                updated[index].is_completed = e.target.checked;
                                setFormData({ ...formData, installments: updated });
                              }}
                              className="w-4 h-4"
                            />
                            Paid
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.installments.filter((_, i) => i !== index);
                              setFormData({ ...formData, installments: updated.length > 0 ? updated : [createEmptyInstallment()] });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-red-700">Other Expenses (Registration, Woodwork, etc.)</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        other_expenses: [...formData.other_expenses, createEmptyOtherExpense()],
                      });
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    + Add Expense
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.other_expenses.map((exp, index) => (
                    <div key={exp.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={exp.name}
                            onChange={(e) => {
                              const updated = [...formData.other_expenses];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, other_expenses: updated });
                            }}
                            placeholder="e.g., Registration"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={exp.amount}
                            onChange={(e) => {
                              const updated = [...formData.other_expenses];
                              updated[index].amount = Number(e.target.value);
                              setFormData({ ...formData, other_expenses: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={exp.date}
                            onChange={(e) => {
                              const updated = [...formData.other_expenses];
                              updated[index].date = e.target.value;
                              setFormData({ ...formData, other_expenses: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Paid By</label>
                          <select
                            value={exp.paid_by}
                            onChange={(e) => {
                              const updated = [...formData.other_expenses];
                              updated[index].paid_by = e.target.value as PaidBy;
                              setFormData({ ...formData, other_expenses: updated });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="individual">Individual</option>
                            <option value="bank">Bank</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.is_completed}
                              onChange={(e) => {
                                const updated = [...formData.other_expenses];
                                updated[index].is_completed = e.target.checked;
                                setFormData({ ...formData, other_expenses: updated });
                              }}
                              className="w-4 h-4"
                            />
                            Paid
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.other_expenses.filter((_, i) => i !== index);
                              setFormData({ ...formData, other_expenses: updated.length > 0 ? updated : [createEmptyOtherExpense()] });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowInstallmentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowInstallmentModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showIncomeExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-green-600 mb-4">Manage Income & Expenses</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add recurring income and expenses with their frequencies. These will be included in the cashflow projections.
              </p>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-green-700">Income</h4>
                  <button
                    type="button"
                    onClick={() => setModalIncomes([...modalIncomes, createEmptyCashflowRow()])}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Income
                  </button>
                </div>
                <div className="space-y-3">
                  {modalIncomes.map((inc, index) => (
                    <div key={inc.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={inc.name}
                            onChange={(e) => {
                              const updated = [...modalIncomes];
                              updated[index].name = e.target.value;
                              setModalIncomes(updated);
                            }}
                            placeholder="e.g., Salary, Rent"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={inc.amount}
                            onChange={(e) => {
                              const updated = [...modalIncomes];
                              updated[index].amount = Number(e.target.value);
                              setModalIncomes(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Frequency</label>
                          <select
                            value={inc.frequency}
                            onChange={(e) => {
                              const updated = [...modalIncomes];
                              updated[index].frequency = e.target.value;
                              setModalIncomes(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
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
                            onChange={(e) => {
                              const updated = [...modalIncomes];
                              updated[index].start_date = e.target.value;
                              setModalIncomes(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = modalIncomes.filter((_, i) => i !== index);
                              setModalIncomes(updated.length > 0 ? updated : [createEmptyCashflowRow()]);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-red-700">Expenses</h4>
                  <button
                    type="button"
                    onClick={() => setModalExpenses([...modalExpenses, createEmptyCashflowRow()])}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    + Add Expense
                  </button>
                </div>
                <div className="space-y-3">
                  {modalExpenses.map((exp, index) => (
                    <div key={exp.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            type="text"
                            value={exp.name}
                            onChange={(e) => {
                              const updated = [...modalExpenses];
                              updated[index].name = e.target.value;
                              setModalExpenses(updated);
                            }}
                            placeholder="e.g., Maintenance, Bills"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount (₹)</label>
                          <input
                            type="number"
                            value={exp.amount}
                            onChange={(e) => {
                              const updated = [...modalExpenses];
                              updated[index].amount = Number(e.target.value);
                              setModalExpenses(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Frequency</label>
                          <select
                            value={exp.frequency}
                            onChange={(e) => {
                              const updated = [...modalExpenses];
                              updated[index].frequency = e.target.value;
                              setModalExpenses(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
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
                            onChange={(e) => {
                              const updated = [...modalExpenses];
                              updated[index].start_date = e.target.value;
                              setModalExpenses(updated);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = modalExpenses.filter((_, i) => i !== index);
                              setModalExpenses(updated.length > 0 ? updated : [createEmptyCashflowRow()]);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowIncomeExpenseModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...formData, incomes: modalIncomes, expenses: modalExpenses });
                    setShowIncomeExpenseModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showLoanConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Loan Configuration</h2>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Core Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Principal Amount (₹)</label>
                    <input
                      type="number"
                      value={loanConfig.principalAmount || ''}
                      onChange={(e) => setLoanConfig({ ...loanConfig, principalAmount: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Enter principal amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanConfig.interestRate || ''}
                      onChange={(e) => setLoanConfig({ ...loanConfig, interestRate: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Annual interest rate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenure (Months)</label>
                    <input
                      type="number"
                      value={loanConfig.tenureMonths || ''}
                      onChange={(e) => setLoanConfig({ ...loanConfig, tenureMonths: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Tenure in months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={loanConfig.startDate}
                      onChange={(e) => setLoanConfig({ ...loanConfig, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <h3 className="font-medium text-gray-700 border-b pb-2 mt-6">Overdraft Configuration</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={loanConfig.isOverdraftLinked}
                    onChange={(e) => setLoanConfig({ ...loanConfig, isOverdraftLinked: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Link Overdraft Account</label>
                </div>

                {loanConfig.isOverdraftLinked && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Overdraft Cash Amount (₹)</label>
                      <input
                        type="number"
                        value={loanConfig.overdraftCashAmount || ''}
                        onChange={(e) => setLoanConfig({ ...loanConfig, overdraftCashAmount: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Enter overdraft amount"
                      />
                      {loanConfig.principalAmount > 0 && loanConfig.overdraftCashAmount > loanConfig.principalAmount && (
                        <p className="text-red-500 text-sm mt-1">Overdraft cannot exceed principal amount</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Impact Type</label>
                      <select
                        value={loanConfig.impactType}
                        onChange={(e) => setLoanConfig({ ...loanConfig, impactType: e.target.value as 'EMI' | 'TENURE' })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="EMI">Reduce EMI</option>
                        <option value="TENURE">Reduce Tenure</option>
                      </select>
                    </div>
                    <p className="text-sm text-blue-700">
                      {loanConfig.impactType === 'EMI' 
                        ? 'Overdraft amount will reduce the principal for EMI calculation'
                        : 'Full principal used for EMI, tenure reduced proportionally'}
                    </p>
                  </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-800">
                      {isPreEMIMode ? 'Calculated Pre-EMI:' : 'Calculated EMI:'}
                    </span>
                    <span className="text-lg font-bold text-purple-900">
                      ₹{(isPreEMIMode ? calculatePreEMI() : loanConfig.emiAmount).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    {isPreEMIMode
                      ? 'Pre-EMI: Bank disbursed past installments + interest component'
                      : loanConfig.isOverdraftLinked && loanConfig.impactType === 'EMI'
                      ? 'EMI calculated on reduced principal (principal - overdraft)'
                      : loanConfig.isOverdraftLinked && loanConfig.impactType === 'TENURE'
                      ? 'EMI calculated on full principal with adjusted tenure'
                      : 'Standard EMI calculation'}
                  </p>
                </div>

                {isPreEMIMode && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-700 border-b pb-2">Installments (Pre-EMI Period)</h3>
                      <button
                        type="button"
                        onClick={() => setModalInstallments([...modalInstallments, createEmptyInstallment()])}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        + Add Installment
                      </button>
                    </div>
                    
                    {modalInstallments.map((inst, index) => (
                      <div key={inst.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Name</label>
                            <input
                              type="text"
                              value={inst.name}
                              onChange={(e) => {
                                const updated = [...modalInstallments];
                                updated[index].name = e.target.value;
                                setModalInstallments(updated);
                              }}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              placeholder="e.g., Installment 1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Amount (₹)</label>
                            <input
                              type="number"
                              value={inst.amount || ''}
                              onChange={(e) => {
                                const updated = [...modalInstallments];
                                updated[index].amount = Number(e.target.value);
                                setModalInstallments(updated);
                              }}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Amount"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Date</label>
                            <input
                              type="date"
                              value={inst.date}
                              onChange={(e) => {
                                const updated = [...modalInstallments];
                                updated[index].date = e.target.value;
                                setModalInstallments(updated);
                              }}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Paid By</label>
                            <select
                              value={inst.paid_by}
                              onChange={(e) => {
                                const updated = [...modalInstallments];
                                updated[index].paid_by = e.target.value as PaidBy;
                                setModalInstallments(updated);
                              }}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            >
                              <option value="individual">Self</option>
                              <option value="bank">Bank</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Type</label>
                            <div className="flex items-center gap-2 mt-1">
                              <select
                                value={inst.is_interest ? 'interest' : 'principal'}
                                onChange={(e) => {
                                  const updated = [...modalInstallments];
                                  updated[index].is_interest = e.target.value === 'interest';
                                  setModalInstallments(updated);
                                }}
                                className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              >
                                <option value="principal">Principal</option>
                                <option value="interest">Interest Only</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = modalInstallments.filter((_, i) => i !== index);
                                  setModalInstallments(updated.length > 0 ? updated : [createEmptyInstallment()]);
                                }}
                                className="text-red-600 hover:text-red-800 text-sm px-2"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Only bank-disbursed installments up to today are considered for pre-EMI calculation. 
                        Interest-only installments calculate interest on full principal.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowLoanConfigModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveLoanConfig()}
                  disabled={!loanConfig.principalAmount || !loanConfig.interestRate || !loanConfig.tenureMonths || !loanConfig.startDate || (loanConfig.isOverdraftLinked && loanConfig.overdraftCashAmount > loanConfig.principalAmount)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}