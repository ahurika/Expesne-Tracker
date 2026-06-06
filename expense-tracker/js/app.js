(function () {
  const form = document.getElementById('expenseForm');
  const nameInput = document.getElementById('expenseName');
  const amountInput = document.getElementById('expenseAmount');
  const nameError = document.getElementById('nameError');
  const amountError = document.getElementById('amountError');
  const totalEl = document.getElementById('totalAmount');
  const expenseListEl = document.getElementById('expenseList');
  const emptyStateEl = document.getElementById('emptyState');
  const expenseCountEl = document.getElementById('expenseCount');
  const dateEl = document.getElementById('currentDate');
  const toast = document.getElementById('toast');

  let expenses = [];
  let toastTimer = null;

  /** Format number as Naira currency */
  function formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Display today's date */
  function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }

  /** Show toast notification */
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  /** Validate form and return errors object */
  function validate(name, amount) {
    const errors = { name: '', amount: '' };
    if (!name.trim()) {
      errors.name = 'Expense name is required.';
    }
    if (amount === '' || amount === null) {
      errors.amount = 'Amount is required.';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }
    return errors;
  }

  /** Render error messages and highlight inputs */
  function renderErrors(errors) {
    nameError.textContent = errors.name;
    amountError.textContent = errors.amount;
    nameInput.classList.toggle('error', !!errors.name);
    amountInput.classList.toggle('error', !!errors.amount);
  }

  /** Clear all error styles */
  function clearErrors() {
    nameError.textContent = '';
    amountError.textContent = '';
    nameInput.classList.remove('error');
    amountInput.classList.remove('error');
  }

  /** Update the total display */
  function updateTotal() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalEl.textContent = formatNaira(total);
  }

  /** Update expense count */
  function updateCount() {
    const count = expenses.length;
    expenseCountEl.textContent = count === 1 ? '1 expense' : count + ' expenses';
  }

  /** Render the expense list */
  function renderList() {
    if (expenses.length === 0) {
      expenseListEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>No expenses added yet.</p>
        </div>
      `;
      return;
    }

    const items = expenses
      .map(
        (exp) => `
        <div class="expense-item" data-id="${exp.id}">
          <div class="expense-info">
            <div class="expense-name">${escapeHtml(exp.name)}</div>
            <div class="expense-date">${exp.date}</div>
          </div>
          <div class="expense-amount">${formatNaira(exp.amount)}</div>
          <button class="btn btn-danger delete-btn" data-id="${exp.id}">
            🗑 Delete
          </button>
        </div>
      `
      )
      .join('');

    expenseListEl.innerHTML = items;
  }

  /** Simple HTML escaping */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /** Get today's formatted date string */
  function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /** Add a new expense */
  function addExpense(name, amount) {
    const expense = {
      id: Date.now() + Math.random(),
      name: name.trim(),
      amount: Number(amount),
      date: getFormattedDate(),
    };
    expenses.push(expense);
    updateTotal();
    updateCount();
    renderList();
    showToast('✅ Expense added successfully!');
  }

  /** Delete an expense by id with confirmation */
  function deleteExpense(id) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    if (!confirm(`Delete "${expense.name}" — ₦${Number(expense.amount).toLocaleString()}?`)) return;

    expenses = expenses.filter((e) => e.id !== id);
    updateTotal();
    updateCount();
    renderList();
    showToast('🗑 Expense deleted.');
  }

  // ── Event Listeners ──

  /** Form submit */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value;
    const amount = amountInput.value;
    const errors = validate(name, amount);

    if (errors.name || errors.amount) {
      renderErrors(errors);
      return;
    }

    addExpense(name, amount);
    form.reset();
    nameInput.focus();
  });

  /** Delete button delegation */
  expenseListEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    deleteExpense(id);
  });

  /** Clear errors on input */
  nameInput.addEventListener('input', function () {
    nameError.textContent = '';
    nameInput.classList.remove('error');
  });

  amountInput.addEventListener('input', function () {
    amountError.textContent = '';
    amountInput.classList.remove('error');
  });

  // ── Initialise ──
  setCurrentDate();
  updateTotal();
  updateCount();
  renderList();
})();
