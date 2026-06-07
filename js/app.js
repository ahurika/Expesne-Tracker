(function () {
  const CATEGORIES = [
    { name: 'Food & Dining', color: '#ef4444' },
    { name: 'Transport', color: '#f97316' },
    { name: 'Utilities', color: '#eab308' },
    { name: 'Entertainment', color: '#22c55e' },
    { name: 'Health', color: '#06b6d4' },
    { name: 'Education', color: '#3b82f6' },
    { name: 'Shopping', color: '#8b5cf6' },
    { name: 'Charity', color: '#ec4899' },
    { name: 'Miscellaneous', color: '#64748b' },
  ];

  const form = document.getElementById('expenseForm');
  const nameInput = document.getElementById('expenseName');
  const amountInput = document.getElementById('expenseAmount');
  const categorySelect = document.getElementById('expenseCategory');
  const nameError = document.getElementById('nameError');
  const amountError = document.getElementById('amountError');
  const categoryError = document.getElementById('categoryError');
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
  const editCategory = document.getElementById('editCategory');
  const editNameError = document.getElementById('editNameError');
  const editAmountError = document.getElementById('editAmountError');
  const editCategoryError = document.getElementById('editCategoryError');
  const editCancel = document.getElementById('editCancel');

  const successOverlay = document.getElementById('successOverlay');
  const successMessage = document.getElementById('successMessage');
  const successOk = document.getElementById('successOk');

  const chartCanvas = document.getElementById('expenseChart');
  const chartEmpty = document.getElementById('chartEmpty');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let expenses = [];
  let successTimer = null;
  let deleteId = null;
  let editId = null;
  let expenseChart = null;
  let currentFilter = 'monthly';

  function saveExpenses() {
    try {
      localStorage.setItem('smartMoneyExpenses', JSON.stringify(expenses));
    } catch (e) {}
  }

  function loadExpenses() {
    try {
      var data = localStorage.getItem('smartMoneyExpenses');
      if (data) {
        expenses = JSON.parse(data);
      }
    } catch (e) {}
  }

  function populateCategorySelects() {
    var html = '<option value="">Select category</option>';
    for (var i = 0; i < CATEGORIES.length; i++) {
      html += '<option value="' + CATEGORIES[i].name + '">' + CATEGORIES[i].name + '</option>';
    }
    categorySelect.innerHTML = html;
    editCategory.innerHTML = html;
  }

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

  function validate(name, amount, category) {
    var errors = { name: '', amount: '', category: '' };
    if (!name.trim()) errors.name = 'Expense name is required.';
    if (amount === '' || amount === null) {
      errors.amount = 'Amount is required.';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }
    if (!category) errors.category = 'Please select a category.';
    return errors;
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

  function getCategoryColor(catName) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].name === catName) return CATEGORIES[i].color;
    }
    return '#64748b';
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
      '<span>Category</span>' +
      '<span>Date</span>' +
      '<span>Amount</span>' +
      '<span>Action</span>' +
      '</div>' +
      '</div>';

    for (var i = 0; i < expenses.length; i++) {
      var exp = expenses[i];
      var name = escapeHtml(exp.name);
      var cat = escapeHtml(exp.category || 'Miscellaneous');
      var catColor = getCategoryColor(cat);
      html +=
        '<div class="expense-row" data-id="' +
        exp.id +
        '">' +
        '<div class="expense-row-name">' +
        name +
        '</div>' +
        '<div class="expense-row-category">' +
        '<span class="category-badge" style="--cat-color: ' + catColor + '">' +
        cat +
        '</span>' +
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

  function addExpense(name, amount, category) {
    var expense = {
      id: Date.now() + Math.random(),
      name: name.trim(),
      amount: Number(amount),
      category: category,
      date: getFormattedDate(),
      dateISO: getTodayISO(),
    };
    expenses.push(expense);
    saveExpenses();
    updateTotal();
    updateCount();
    renderList();
    updateChart();
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
    saveExpenses();
    updateTotal();
    updateCount();
    renderList();
    updateChart();
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
    editCategory.value = expense.category || '';
    editNameError.textContent = '';
    editAmountError.textContent = '';
    editCategoryError.textContent = '';
    editName.classList.remove('error');
    editAmount.classList.remove('error');
    editCategory.classList.remove('error');
    editOverlay.classList.add('active');
    editName.focus();
  }

  function saveEdit(e) {
    e.preventDefault();
    if (editId === null) return;

    editNameError.textContent = '';
    editAmountError.textContent = '';
    editCategoryError.textContent = '';
    editName.classList.remove('error');
    editAmount.classList.remove('error');
    editCategory.classList.remove('error');

    var name = editName.value;
    var amount = editAmount.value;
    var category = editCategory.value;
    var errors = validate(name, amount, category);

    if (errors.name || errors.amount || errors.category) {
      editNameError.textContent = errors.name;
      editAmountError.textContent = errors.amount;
      editCategoryError.textContent = errors.category;
      editName.classList.toggle('error', !!errors.name);
      editAmount.classList.toggle('error', !!errors.amount);
      editCategory.classList.toggle('error', !!errors.category);
      return;
    }

    var expense = expenses.find(function (exp) {
      return exp.id === editId;
    });
    if (expense) {
      expense.name = name.trim();
      expense.amount = Number(amount);
      expense.category = category;
    }

    editId = null;
    editOverlay.classList.remove('active');
    saveExpenses();
    updateTotal();
    updateCount();
    renderList();
    updateChart();
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

  function getFilteredExpenses(filter) {
    var now = new Date();
    var today = getTodayISO();

    if (filter === 'daily') {
      return expenses.filter(function (e) {
        return e.dateISO === today;
      });
    }

    if (filter === 'weekly') {
      var weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      var filterDate = weekAgo.toISOString().split('T')[0];
      return expenses.filter(function (e) {
        return e.dateISO >= filterDate;
      });
    }

    if (filter === 'monthly') {
      var monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      var filterDate = monthAgo.toISOString().split('T')[0];
      return expenses.filter(function (e) {
        return e.dateISO >= filterDate;
      });
    }

    return expenses;
  }

  function updateChart() {
    if (!chartCanvas) return;

    var filtered = getFilteredExpenses(currentFilter);

    var categoryData = {};
    for (var i = 0; i < CATEGORIES.length; i++) {
      categoryData[CATEGORIES[i].name] = 0;
    }
    for (var i = 0; i < filtered.length; i++) {
      var cat = filtered[i].category || 'Miscellaneous';
      if (categoryData[cat] === undefined) categoryData[cat] = 0;
      categoryData[cat] += filtered[i].amount;
    }

    var labels = [];
    var data = [];
    var colors = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (categoryData[CATEGORIES[i].name] > 0) {
        labels.push(CATEGORIES[i].name);
        data.push(categoryData[CATEGORIES[i].name]);
        colors.push(CATEGORIES[i].color);
      }
    }

    if (expenseChart) {
      expenseChart.destroy();
      expenseChart = null;
    }

    if (labels.length === 0) {
      chartCanvas.style.display = 'none';
      chartEmpty.style.display = 'block';
      return;
    }

    chartCanvas.style.display = 'block';
    chartEmpty.style.display = 'none';

    expenseChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Spending',
          data: data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return '₦' + ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 });
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '₦' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  function initChart() {
    for (var i = 0; i < filterBtns.length; i++) {
      filterBtns[i].addEventListener('click', function () {
        var btns = document.querySelectorAll('.filter-btn');
        for (var j = 0; j < btns.length; j++) {
          btns[j].classList.remove('active');
        }
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        updateChart();
      });
    }
    updateChart();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    nameError.textContent = '';
    amountError.textContent = '';
    categoryError.textContent = '';
    nameInput.classList.remove('error');
    amountInput.classList.remove('error');
    categorySelect.classList.remove('error');

    var name = nameInput.value;
    var amount = amountInput.value;
    var category = categorySelect.value;
    var errors = validate(name, amount, category);

    if (errors.name || errors.amount || errors.category) {
      nameError.textContent = errors.name;
      amountError.textContent = errors.amount;
      categoryError.textContent = errors.category;
      nameInput.classList.toggle('error', !!errors.name);
      amountInput.classList.toggle('error', !!errors.amount);
      categorySelect.classList.toggle('error', !!errors.category);
      return;
    }

    addExpense(name, amount, category);
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

  categorySelect.addEventListener('change', function () {
    categoryError.textContent = '';
    categorySelect.classList.remove('error');
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

  loadExpenses();
  populateCategorySelects();
  setCurrentDate();
  updateTotal();
  updateCount();
  renderList();
  initChart();
})();
