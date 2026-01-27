class Insights {
    constructor() {
        this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    }

    // Main entry point
    generate(transactions, categories) {
        if (!transactions || transactions.length === 0) {
            return [{ message: "Welcome! Add your first transaction to get insights.", level: 'info' }];
        }

        const currentMonthKey = this.getMonthKey(new Date());
        const prevDate = new Date();
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonthKey = this.getMonthKey(prevDate);

        const currentData = this.filterByMonth(transactions, currentMonthKey);
        const prevData = this.filterByMonth(transactions, prevMonthKey);

        const insights = [];

        // 1. Check Cash Flow
        const income = this.sumType(currentData, 'income');
        const expense = this.sumType(currentData, 'expense');

        if (income === 0 && expense > 0) {
            insights.push({ message: "No income recorded this month — review your cash flow.", level: 'warning' });
        } else if (expense > income) {
            insights.push({ message: `Your expenses (₹${expense.toFixed(0)}) exceeded income (₹${income.toFixed(0)}) this month.`, level: 'warning' });
        }

        // 2. Compare Total Spending
        const prevExpense = this.sumType(prevData, 'expense');
        if (prevExpense > 0 && expense > 0) {
            const diff = expense - prevExpense;
            const pct = ((diff / prevExpense) * 100).toFixed(0);

            if (diff > 0) {
                insights.push({ message: `Total spending increased by ${pct}% compared to last month.`, level: 'warning' });
            } else {
                insights.push({ message: `Great job! Spending is down ${Math.abs(pct)}% compared to last month.`, level: 'info' });
            }
        }

        // 3. Category Spikes
        const currentCats = this.groupByCategory(currentData);
        const prevCats = this.groupByCategory(prevData);

        for (const [catId, amount] of Object.entries(currentCats)) {
            const prevAmount = prevCats[catId] || 0;
            // Only care if amount is significant (> $50)
            if (amount > 50 && prevAmount > 0) {
                const increase = amount - prevAmount;
                const pct = (increase / prevAmount) * 100;

                if (pct >= 20) {
                    const catName = this.getCategoryName(catId, categories);
                    insights.push({ message: `${catName} spending jumped ${pct.toFixed(0)}% compared to last month.`, level: 'warning' });
                }
            }
        }

        // 4. Onboarding / Empty state fallback
        if (insights.length === 0) {
            if (prevData.length === 0) {
                insights.push({ message: "This is your first month of tracking. Keep going to see trends!", level: 'info' });
            } else {
                insights.push({ message: "Your spending behavior is stable. Good job!", level: 'info' });
            }
        }

        return insights.slice(0, 5); // Limit to top 5
    }

    // Helpers
    getMonthKey(date) {
        return date.toISOString().slice(0, 7); // YYYY-MM
    }

    filterByMonth(txs, monthKey) {
        return txs.filter(t => t.date.startsWith(monthKey));
    }

    sumType(txs, type) {
        return txs.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
    }

    groupByCategory(txs) {
        return txs.filter(t => t.type === 'expense').reduce((acc, t) => {
            acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
            return acc;
        }, {});
    }

    getCategoryName(id, categories) {
        const cat = categories.find(c => c.id == id);
        return cat ? cat.name : 'Unknown';
    }
}
