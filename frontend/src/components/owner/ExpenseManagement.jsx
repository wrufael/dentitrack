import React, { useState, useEffect, useMemo } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// ✅ FIX: this list now matches EXACTLY the categories accepted by
// ExpenseController's validator (see the enum in store()/update()).
// Before, this list had "supplies", "salaries", "equipment" — none of
// which the backend accepted — so picking those and saving would fail
// with a 422 error. "inventory" is included too, so the auto-generated
// coffee/inventory expenses show a real label instead of falling back
// to "Other".
const CATEGORIES = [
  { value: "supplies", label: "📦 Supplies" },
  { value: "salary", label: "💰 Salary" },
  { value: "rent", label: "🏢 Rent" },
  { value: "utilities", label: "💡 Utilities" },
  { value: "equipment", label: "🔧 Equipment" },
  { value: "marketing", label: "📢 Marketing" },
  { value: "insurance", label: "🛡️ Insurance" },
  { value: "tax", label: "🏛️ Tax" },
  { value: "inventory", label: "📥 Inventory (auto)" },
  { value: "maintenance", label: "🛠️ Maintenance" },
  { value: "software", label: "💻 Software" },
  { value: "training", label: "🎓 Training" },
  { value: "other", label: "📋 Other" },
];

const emptyForm = {
  title: "",
  category: "other",
  description: "",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  payment_method: "cash",
  transaction_id: "",
  notes: "",
};

export default function ExpenseManagement() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // ✅ FETCH EXPENSES FROM DATABASE
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/expenses");
      if (response.data.success) {
        setEntries(response.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  // ✅ Only filters out LEFTOVER legacy rows from before the inventory fix.
  // Going forward, restocking never creates a "Restock: ..." row — it
  // updates the item's existing "Inventory: <name>" expense instead — so
  // this filter has nothing new to catch, but it's kept so any old
  // duplicate rows you haven't manually deleted yet stay out of view.
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const title = e.title || "";
      const description = e.description || "";
      if (title.includes("Restock:") || description.includes("Auto-generated")) {
        return false;
      }
      return true;
    });
  }, [entries]);

  // ✅ CALCULATE SUMMARIES BASED ON FILTERED ENTRIES
  const todayTotal = useMemo(
    () => filteredEntries.filter((e) => e.expense_date === today).reduce((s, e) => s + parseFloat(e.amount), 0),
    [filteredEntries, today]
  );

  const monthTotal = useMemo(
    () => filteredEntries.filter((e) => e.expense_date?.slice(0, 7) === today.slice(0, 7)).reduce((s, e) => s + parseFloat(e.amount), 0),
    [filteredEntries, today]
  );

  const totalExpenses = useMemo(
    () => filteredEntries.reduce((s, e) => s + parseFloat(e.amount), 0),
    [filteredEntries]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }

    try {
      // ✅ Prepare data for backend
      const payload = {
        title: form.title,
        description: form.description || "",
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        category: form.category,
        payment_method: form.payment_method || "cash",
        transaction_id: form.transaction_id || "",
        notes: form.notes || "",
      };

      const response = await api.post("/expenses", payload);

      if (response.data.success) {
        toast.success("✅ Expense recorded successfully!");
        setForm(emptyForm);
        setShowForm(false);
        fetchExpenses(); // ✅ Refresh list
      }
    } catch (error) {
      console.error("❌ Save error:", error);

      // ✅ Show detailed error
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || "Failed to add expense");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400">Today's Expenses</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{formatAmount(todayTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400">This Month</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{formatAmount(monthTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400">Total Expenses</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{formatAmount(totalExpenses)}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Note:</strong> Adding a new inventory item creates an "Inventory: &lt;name&gt;" expense here.
          Restocking that same item later adds to this same expense's total instead of creating a new row.
        </p>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5A5] text-white text-sm font-medium hover:bg-[#0B7A7A] transition-colors"
        >
          <PlusIcon className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Description</th>
              <th className="py-3 px-4 font-medium text-right">Amount</th>
              <th className="py-3 px-4 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400">
                  No expenses recorded yet. Click "Add Expense" to get started.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => {
                const category = CATEGORIES.find(c => c.value === e.category) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-600">{e.expense_date}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{e.title}</td>
                    <td className="py-3 px-4 text-gray-700">{category.label}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{e.description || "-"}</td>
                    <td className="py-3 px-4 font-mono text-red-600 text-right">
                      - {formatAmount(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Add Manual Expense</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Staff Salary - July 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="cash">💰 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="cheque">📝 Cheque</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter transaction reference"
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0EA5A5] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0B7A7A] transition-colors"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}