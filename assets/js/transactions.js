class TransactionManager {
    static validate(data) {
        const errors = [];
        if (!data.amount || data.amount <= 0) errors.push("Amount must be greater than 0");
        if (!data.date) errors.push("Date is required");
        if (new Date(data.date) > new Date()) errors.push("Cannot add future transactions");
        if (!data.category_id) errors.push("Category is required");

        return errors;
    }

    static exportCSV(transactions, categories) {
        if (!transactions.length) return;

        const headers = ["Date", "Type", "Category", "Amount", "Note"];
        const rows = transactions.map(t => {
            const cat = categories.find(c => c.id == t.category_id);
            return [
                t.date,
                t.type,
                cat ? cat.name : 'Unknown',
                t.amount.toFixed(2),
                `"${(t.note || '').replace(/"/g, '""')}"` // Escape quotes
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "expense_tracker_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static exportPDF(transactions, categories, stats) {
        const printWindow = window.open('', '', 'height=600,width=800');

        let rows = '';
        transactions.forEach(t => {
            const cat = categories.find(c => c.id == t.category_id);
            const amountClass = t.type === 'income' ? 'color: green' : 'color: red';
            rows += `
                <tr>
                    <td>${t.date}</td>
                    <td>${cat ? cat.name : 'Unknown'}</td>
                    <td style="${amountClass}">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</td>
                    <td>${t.note || ''}</td>
                </tr>
             `;
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Expense Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #1e293b; }
                    .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 10px; background: #f1f5f9; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                    th { background-color: #f8fafc; }
                </style>
            </head>
            <body>
                <h1>Expense Tracker Report</h1>
                <div class="summary">
                    <div><strong>Income:</strong> ₹${stats.income.toFixed(2)}</div>
                    <div><strong>Expenses:</strong> ₹${stats.expense.toFixed(2)}</div>
                    <div><strong>Balance:</strong> ₹${stats.balance.toFixed(2)}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        // Allow time for styles to load
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
}
