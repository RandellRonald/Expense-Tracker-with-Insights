class UI {
    constructor() {
        this.$ = (selector) => document.querySelector(selector);
        this.$$ = (selector) => document.querySelectorAll(selector);
    }

    showSection(id) {
        this.$$('.screen').forEach(el => el.classList.add('hidden'));
        this.$$('.screen').forEach(el => el.classList.remove('active'));
        const target = this.$(id);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }

    updateUserDisplay(email) {
        const el = this.$('#user-display');
        if (el) el.textContent = email;
    }

    renderStats(transactions) {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        this.$('#total-income').textContent = this.formatCurrency(income);
        this.$('#total-expense').textContent = this.formatCurrency(expense);
        this.$('#total-balance').textContent = this.formatCurrency(balance);
    }

    renderTransactions(transactions, categories) {
        const list = this.$('#transaction-list');
        list.innerHTML = '';

        if (transactions.length === 0) {
            list.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">No transactions yet.</p>';
            return;
        }

        // Show last 10
        transactions.slice(0, 10).forEach(t => {
            const cat = categories.find(c => c.id == t.category_id);
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.innerHTML = `
                <div class="t-info">
                    <h4>${cat ? cat.name : 'Unknown'}</h4>
                    <span class="t-date">${t.date}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="t-amount ${t.type === 'income' ? 'positive' : 'negative'}">
                        ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                    </span>
                    <div class="t-actions">
                        <button class="btn-icon delete-btn" data-id="${t.id}">🗑️</button>
                    </div>
                </div>
            `;
            list.appendChild(li);
        });
    }

    renderInsights(insightList) {
        const container = this.$('#insights-list');
        container.innerHTML = '';

        insightList.forEach(insight => {
            const div = document.createElement('div');
            div.className = `insight-item ${insight.level}`;
            div.textContent = insight.message;
            container.appendChild(div);
        });
    }

    renderChart(transactions, categories) {
        const canvas = this.$('#category-chart');
        const ctx = canvas.getContext('2d');

        // Reset canvas size for retina
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        if (transactions.length === 0) {
            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.font = "14px Inter";
            ctx.fillStyle = "#64748B";
            ctx.fillText("No data to display", 20, 50);
            return;
        }

        // Group by category (Expenses only)
        const data = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (!data[t.category_id]) data[t.category_id] = 0;
            data[t.category_id] += t.amount;
        });

        const sortedCats = Object.entries(data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5

        const maxVal = sortedCats.length ? sortedCats[0][1] : 0;
        const barHeight = 24;
        const gap = 16;
        let y = 20;

        ctx.clearRect(0, 0, rect.width, rect.height);

        sortedCats.forEach(([catId, amount]) => {
            const cat = categories.find(c => c.id == catId);
            const name = cat ? cat.name : 'Unknown';
            const width = (amount / maxVal) * (rect.width - 100); // Leave space for text

            // Text
            ctx.fillStyle = "#0F172A";
            ctx.font = "12px Inter";
            ctx.textAlign = "left";
            ctx.fillText(name, 0, y + 16);

            // Bar Bg
            ctx.fillStyle = "#F1F5F9";
            ctx.fillRect(80, y, rect.width - 80, barHeight);

            // Bar Fill
            ctx.fillStyle = "#2563EB";
            // Rounded corners logic omitted for simplicity, basic rect
            ctx.fillRect(80, y, width, barHeight);

            // Amount
            ctx.fillStyle = "#64748B";
            ctx.fillText(this.formatCurrency(amount), 80 + width + 5, y + 16);

            y += barHeight + gap;
        });
    }

    populateCategories(categories) {
        const select = this.$('#category');
        select.innerHTML = '';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.name} (${c.type})`;
            select.appendChild(opt);
        });
    }

    formatCurrency(num) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
    }
}
