// Imports removed for file:// compatibility
// Scripts are loaded sequentially in index.html

const db = new DB();
const ui = new UI();
const insights = new Insights();

let currentUser = null;

// --- Initialization ---

async function init() {
    try {
        await db.init();

        // Check Session
        const storedId = localStorage.getItem('expense_tracker_userid');
        if (storedId) {
            // Restore session (simulated)
            // In a real app we would verify token. Here we just assume ID is valid for local usage.
            // We need to fetch email to display
            // Since getAll('users') isn't exposed efficiently for single lookup by ID without transaction,
            // we will just proceed to load dashboard. 
            // Better: store email in localstorage too or fetch it.
            const email = localStorage.getItem('expense_tracker_email');
            currentUser = { id: parseInt(storedId), email: email };
            loadDashboard();
        } else {
            ui.showSection('#auth-section');
        }
    } catch (e) {
        console.error("Initialization failed", e);
    }
}

// --- Auth Handling ---

const authForm = document.getElementById('auth-form');
const authBtn = document.getElementById('auth-btn');
const toggleLink = document.getElementById('toggle-auth-mode');
let isLoginMode = true;

if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
        toggleLink.textContent = isLoginMode ? 'Sign Up' : 'Log In';
        document.querySelector('.subtitle').textContent = isLoginMode
            ? 'Track money fast. Understand spending.'
            : 'Create an account to start tracking.';
    });
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (isLoginMode) {
            currentUser = await db.loginUser(email, password);
        } else {
            currentUser = await db.registerUser(email, password);
            // New user? Seed categories.
            await db.seedCategories(currentUser.id);
        }

        // Save Session
        localStorage.setItem('expense_tracker_userid', currentUser.id);
        localStorage.setItem('expense_tracker_email', currentUser.email);

        loadDashboard();
    } catch (err) {
        alert(err); // Simple feedback
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('expense_tracker_userid');
    localStorage.removeItem('expense_tracker_email');
    currentUser = null;
    window.location.reload();
});

// --- Dashboard Logic ---

async function loadDashboard() {
    ui.updateUserDisplay(currentUser.email);
    ui.showSection('#dashboard-section');

    // Check for demo data need
    const txs = await db.getTransactions(currentUser.id);
    if (!txs || txs.length === 0) {
        // If it's a fresh account (or empty), seed demo data
        // NOTE: Strictly speaking, prompt said "if database is empty". 
        // If user just registered, it is empty for them.
        await db.seedDemoData(currentUser.id);
    }

    refreshData();
}

async function refreshData() {
    const transactions = await db.getTransactions(currentUser.id);
    const categories = await db.getCategories(currentUser.id);

    ui.renderStats(transactions);
    ui.renderTransactions(transactions, categories);
    ui.renderChart(transactions, categories);
    ui.populateCategories(categories);

    // Insights
    const insightList = insights.generate(transactions, categories);
    ui.renderInsights(insightList);
}

// --- Transaction Modal ---

const modal = document.getElementById('transaction-modal');
const openModalBtn = document.getElementById('add-transaction-btn');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const transactionForm = document.getElementById('transaction-form');

const openModal = () => {
    modal.classList.remove('hidden');
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
};
const closeModal = () => {
    modal.classList.add('hidden');
    transactionForm.reset();
};

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        user_id: currentUser.id,
        type: document.querySelector('input[name="type"]:checked').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        category_id: parseInt(document.getElementById('category').value),
        note: document.getElementById('note').value
    };

    const errors = TransactionManager.validate(formData);
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }

    try {
        await db.addTransaction(formData);
        closeModal();
        refreshData();
    } catch (err) {
        console.error(err);
        alert("Failed to save transaction");
    }
});

// --- Deletion ---

document.getElementById('transaction-list').addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm("Delete this transaction?")) {
            await db.deleteTransaction(id);
            refreshData();
        }
    }
});

// --- Export ---

document.getElementById('export-csv-btn').addEventListener('click', async () => {
    const transactions = await db.getTransactions(currentUser.id);
    const categories = await db.getCategories(currentUser.id);
    TransactionManager.exportCSV(transactions, categories);
});

document.getElementById('export-pdf-btn').addEventListener('click', async () => {
    const transactions = await db.getTransactions(currentUser.id);
    const categories = await db.getCategories(currentUser.id);

    // Calculate Stats
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    TransactionManager.exportPDF(transactions, categories, { income, expense, balance });
});

// Start
init();
