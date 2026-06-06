(function () {
  const form = document.getElementById('expenseForm');
  const nameInput = document.getElementById('expenseName');
  const amountInput = document.getElementById('expenseAmount');
  const nameError = document.getElementById('nameError');
  const amountError = document.getElementById('amountError');
  const totalEl = document.getElementById('totalAmount');
  const expenseCountEl = document.getElementById('expenseCount');
  const expenseListEl = document.getElementById('expenseList');
  const dateEl = document.getElementById('currentDate');
  const deleteOverlay = document.getElementById('deleteModalOverlay');
  const deleteBody = document.getElementById('deleteModalBody');
  const deleteConfirm = document.getElementById('deleteConfirm');
  const deleteCancel = document.getElementById('deleteCancel');

  const editOverlay = document.getElementById('editModalOverlay');
  const editForm = document.getElementById('editForm');
  const editName = document.getElementById('editName');
  const editAmount = document.getElementById('editAmount');
  const editNameError = document.getElementById('editNameError');
  const editAmountError = document.getElementById('editAmountError');
  const editCancel = document.getElementById('editCancel');

  const successOverlay = document.getElementById('successOverlay');
  const successMessage = document.getElementById('successMessage');
  const successOk = document.getElementById('successOk');

  let expenses = [];
  let successTimer = null;
  let deleteId = null;
  let editId = null;

  function formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function setCurrentDate() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function showSuccessModal(message) {
    if (successTimer) clearTimeout(successTimer);
    successMessage.textContent = message;
    successOverlay.classList.add('active');
    successTimer = setTimeout(function () {
      successOverlay.classList.remove('active');
    }, 2000);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getFormattedDate() {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getTodayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function validate(name, amount) {
    var errors = { name: '', amount: '' };
    if (!name.trim()) errors.name = 'Expense name is required.';
    if (amount === '' || amount === null) {
      errors.amount = 'Amount is required.';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }
    return errors;
  }

  function renderErrors(nameErrEl, amountErrEl, nameInp, amountInp, errors) {
    nameErrEl.textContent = errors.name;
    amountErrEl.textContent = errors.amount;
    nameInp.classList.toggle('error', !!errors.name);
    amountInp.classList.toggle('error', !!errors.amount);
  }

  function clearErrors(nameErrEl, amountErrEl, nameInp, amountInp) {
    nameErrEl.textContent = '';
    amountErrEl.textContent = '';
    nameInp.classList.remove('error');
    amountInp.classList.remove('error');
  }

  function updateTotal() {
    var total = expenses.reduce(function (sum, e) {
      return sum + e.amount;
    }, 0);
    totalEl.textContent = formatNaira(total);
  }

  function updateCount() {
    var count = expenses.length;
    expenseCountEl.textContent =
      count === 1 ? '1 expense' : count + ' expenses';
  }

  function renderList() {
    if (expenses.length === 0) {
      expenseListEl.innerHTML =
        '<div class="empty-state"><p>No expenses found.</p></div>';
      return;
    }

    var html =
      '<div class="expense-table">' +
      '<div class="expense-table-header">' +
      '<div>' +
      '<span>Expense</span>' +
      '<span>Date</span>' +
      '<span>Amount</span>' +
      '<span>Action</span>' +
      '</div>' +
      '</div>';

    for (var i = 0; i < expenses.length; i++) {
      var exp = expenses[i];
      var name = escapeHtml(exp.name);
      html +=
        '<div class="expense-row" data-id="' +
        exp.id +
        '">' +
        '<div class="expense-row-name">' +
        name +
        '</div>' +
        '<div class="expense-row-date">' +
        exp.date +
        '</div>' +
        '<div class="expense-row-amount">' +
        formatNaira(exp.amount) +
        '</div>' +
        '<div class="expense-row-actions">' +
        '<div class="kebab-wrapper">' +
        '<button class="kebab-btn" data-id="' +
        exp.id +
        '">&#8942;</button>' +
        '<div class="kebab-menu">' +
        '<button class="kebab-menu-item edit-btn" data-id="' +
        exp.id +
        '">&#9998; Edit</button>' +
        '<button class="kebab-menu-item danger delete-btn" data-id="' +
        exp.id +
        '">&#128465; Delete</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    html += '</div>';
    expenseListEl.innerHTML = html;
  }

  function addExpense(name, amount) {
    var expense = {
      id: Date.now() + Math.random(),
      name: name.trim(),
      amount: Number(amount),
      date: getFormattedDate(),
      dateISO: getTodayISO(),
    };
    expenses.push(expense);
    updateTotal();
    updateCount();
    renderList();
    showSuccessModal('Expense added successfully');
  }

  function showDeleteModal(id) {
    var expense = expenses.find(function (e) {
      return e.id === id;
    });
    if (!expense) return;
    deleteId = id;
    deleteBody.innerHTML =
      'Delete <strong>' +
      escapeHtml(expense.name) +
      '</strong> — ' +
      formatNaira(expense.amount) +
      '?';
    deleteOverlay.classList.add('active');
  }

  function confirmDelete() {
    if (deleteId === null) return;
    expenses = expenses.filter(function (e) {
      return e.id !== deleteId;
    });
    deleteId = null;
    deleteOverlay.classList.remove('active');
    updateTotal();
    updateCount();
    renderList();
    showSuccessModal('Expense deleted');
  }

  function cancelDelete() {
    deleteId = null;
    deleteOverlay.classList.remove('active');
  }

  function showEditModal(id) {
    var expense = expenses.find(function (e) {
      return e.id === id;
    });
    if (!expense) return;
    editId = id;
    editName.value = expense.name;
    editAmount.value = expense.amount;
    editNameError.textContent = '';
    editAmountError.textContent = '';
    editName.classList.remove('error');
    editAmount.classList.remove('error');
    editOverlay.classList.add('active');
    editName.focus();
  }

  function saveEdit(e) {
    e.preventDefault();
    if (editId === null) return;

    editNameError.textContent = '';
    editAmountError.textContent = '';
    editName.classList.remove('error');
    editAmount.classList.remove('error');

    var name = editName.value;
    var amount = editAmount.value;
    var errors = validate(name, amount);

    if (errors.name || errors.amount) {
      editNameError.textContent = errors.name;
      editAmountError.textContent = errors.amount;
      editName.classList.toggle('error', !!errors.name);
      editAmount.classList.toggle('error', !!errors.amount);
      return;
    }

    var expense = expenses.find(function (exp) {
      return exp.id === editId;
    });
    if (expense) {
      expense.name = name.trim();
      expense.amount = Number(amount);
    }

    editId = null;
    editOverlay.classList.remove('active');
    updateTotal();
    updateCount();
    renderList();
    showSuccessModal('Expense updated');
  }

  function cancelEdit() {
    editId = null;
    editOverlay.classList.remove('active');
  }

  function closeAllKebabs() {
    var open = document.querySelectorAll('.kebab-wrapper.open');
    for (var i = 0; i < open.length; i++) {
      open[i].classList.remove('open');
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    nameError.textContent = '';
    amountError.textContent = '';
    nameInput.classList.remove('error');
    amountInput.classList.remove('error');

    var name = nameInput.value;
    var amount = amountInput.value;
    var errors = validate(name, amount);

    if (errors.name || errors.amount) {
      nameError.textContent = errors.name;
      amountError.textContent = errors.amount;
      nameInput.classList.toggle('error', !!errors.name);
      amountInput.classList.toggle('error', !!errors.amount);
      return;
    }

    addExpense(name, amount);
    form.reset();
    nameInput.focus();
  });

  nameInput.addEventListener('input', function () {
    nameError.textContent = '';
    nameInput.classList.remove('error');
  });

  amountInput.addEventListener('input', function () {
    amountError.textContent = '';
    amountInput.classList.remove('error');
  });

  expenseListEl.addEventListener('click', function (e) {
    var kebabBtn = e.target.closest('.kebab-btn');
    if (kebabBtn) {
      e.stopPropagation();
      var wrapper = kebabBtn.closest('.kebab-wrapper');
      var isOpen = wrapper.classList.contains('open');
      closeAllKebabs();
      if (!isOpen) wrapper.classList.add('open');
      return;
    }
    var editBtn = e.target.closest('.kebab-menu .edit-btn');
    if (editBtn) {
      e.stopPropagation();
      closeAllKebabs();
      showEditModal(Number(editBtn.dataset.id));
      return;
    }
    var deleteBtn = e.target.closest('.kebab-menu .delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      closeAllKebabs();
      showDeleteModal(Number(deleteBtn.dataset.id));
      return;
    }
    closeAllKebabs();
  });

  deleteConfirm.addEventListener('click', confirmDelete);
  deleteCancel.addEventListener('click', cancelDelete);
  deleteOverlay.addEventListener('click', function (e) {
    if (e.target === deleteOverlay) cancelDelete();
  });

  editForm.addEventListener('submit', saveEdit);
  editCancel.addEventListener('click', cancelEdit);
  editOverlay.addEventListener('click', function (e) {
    if (e.target === editOverlay) cancelEdit();
  });

  successOk.addEventListener('click', function () {
    if (successTimer) clearTimeout(successTimer);
    successOverlay.classList.remove('active');
  });

  successOverlay.addEventListener('click', function (e) {
    if (e.target === successOverlay) {
      if (successTimer) clearTimeout(successTimer);
      successOverlay.classList.remove('active');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (deleteOverlay.classList.contains('active')) cancelDelete();
      if (editOverlay.classList.contains('active')) cancelEdit();
      if (successOverlay.classList.contains('active')) {
        if (successTimer) clearTimeout(successTimer);
        successOverlay.classList.remove('active');
      }
      closeAllKebabs();
    }
  });

  document.addEventListener('click', function () {
    closeAllKebabs();
  });

  setCurrentDate();
  updateTotal();
  updateCount();
  renderList();
})();
