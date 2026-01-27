class DB {
    constructor() {
        this.dbName = 'expense_tracker';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject("Database error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Categories
                if (!db.objectStoreNames.contains('categories')) {
                    const catStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                    catStore.createIndex('user_id', 'user_id', { unique: false });
                }

                // Transactions
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    txStore.createIndex('user_id', 'user_id', { unique: false });
                    txStore.createIndex('date', 'date', { unique: false });
                }

                // Insights
                if (!db.objectStoreNames.contains('insights')) {
                    const insStore = db.createObjectStore('insights', { keyPath: 'id', autoIncrement: true });
                    insStore.createIndex('user_id', 'user_id', { unique: false });
                }
            };
        });
    }

    // --- User Management ---

    async registerUser(email, password) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            // Allow check if email exists (Index simulation)
            const index = store.index('email');
            const checkRequest = index.get(email);

            checkRequest.onsuccess = () => {
                if (checkRequest.result) {
                    reject("Email already registered");
                    return;
                }

                // Add new user
                const user = {
                    email: email,
                    password_hash: btoa(password), // Simple encoding for demo. REAL APP NEEDS HASHING.
                    created_at: new Date()
                };

                const addRequest = store.add(user);

                addRequest.onsuccess = (e) => {
                    user.id = e.target.result;
                    resolve(user);
                };
            };
        });
    }

    async loginUser(email, password) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');

            const request = index.get(email);

            request.onsuccess = () => {
                const user = request.result;
                if (user && user.password_hash === btoa(password)) {
                    resolve(user);
                } else {
                    reject("Invalid credentials");
                }
            };
        });
    }

    // --- Transactions ---

    async addTransaction(tx) {
        return new Promise((resolve, reject) => {
            // Validation
            if (tx.amount <= 0) return reject("Amount must be positive");

            const transaction = this.db.transaction(['transactions'], 'readwrite');
            const store = transaction.objectStore('transactions');
            const request = store.add(tx);

            request.onsuccess = (e) => {
                tx.id = e.target.result;
                resolve(tx);
            };
            request.onerror = () => reject("Failed to add transaction");
        });
    }

    async getTransactions(userId) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            const index = store.index('user_id');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                // Sort by date desc in JS because IndexedDB sorting is limited
                let results = request.result;
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
        });
    }

    async deleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readwrite');
            const store = transaction.objectStore('transactions');
            const request = store.delete(Number(id));

            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }

    // --- Categories ---

    async seedCategories(userId) {
        const defaults = [
            { name: 'Salary', type: 'income' },
            { name: 'Freelance', type: 'income' },
            { name: 'Food', type: 'expense' },
            { name: 'Rent', type: 'expense' },
            { name: 'Transport', type: 'expense' },
            { name: 'Utilities', type: 'expense' },
            { name: 'Entertainment', type: 'expense' },
            { name: 'Health', type: 'expense' }
        ];

        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        defaults.forEach(cat => {
            store.add({ ...cat, user_id: userId });
        });
    }

    async getCategories(userId) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            const index = store.index('user_id');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
        });
    }

    // --- Demo Data ---

    async seedDemoData(userId) {
        // Checking if already has info
        const txs = await this.getTransactions(userId);
        if (txs.length > 0) return; // Don't seed if data exists

        await this.seedCategories(userId);
        // Wait a bit for categories to commit (simplification)

        // Generate Realistic Data for last 3 months
        const categories = await this.getCategories(userId);
        const incomeCats = categories.filter(c => c.type === 'income');
        const expenseCats = categories.filter(c => c.type === 'expense');

        const demoTxs = [];
        const now = new Date();

        for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Random chance for transaction
            if (Math.random() > 0.7) {
                // Expense
                const cat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
                demoTxs.push({
                    user_id: userId,
                    category_id: cat.id,
                    amount: parseFloat((Math.random() * 50 + 10).toFixed(2)),
                    type: 'expense',
                    date: dateStr,
                    note: 'Demo expense'
                });
            }
        }

        // Monthly Salary
        [0, 1, 2].forEach(monthOffset => {
            const d = new Date();
            d.setMonth(d.getMonth() - monthOffset);
            d.setDate(1);
            if (incomeCats.length > 0) {
                demoTxs.push({
                    user_id: userId,
                    category_id: incomeCats[0].id,
                    amount: 3500,
                    type: 'income',
                    date: d.toISOString().split('T')[0],
                    note: 'Monthly Salary'
                });
            }
        });

        const transaction = this.db.transaction(['transactions'], 'readwrite');
        const store = transaction.objectStore('transactions');
        demoTxs.forEach(tx => store.add(tx));
    }
}
