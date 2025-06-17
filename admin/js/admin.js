const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
const salesHistory = JSON.parse(localStorage.getItem('sales')) || [];

const filterSelect = document.getElementById('date-filter');
const salesList = document.getElementById('sales-list');

function filterSales(days) {
  const now = new Date();
  return salesHistory.filter(sale => {
    const date = new Date(sale.date);
    if (isNaN(date)) return false;
    return days === 'all' || (now - date) / (1000 * 60 * 60 * 24) <= days;
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function renderDashboard(filteredSales) {
  const productCount = {};
  let itemsSold = 0;
  let totalRevenue = 0;

  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  salesList.innerHTML = sortedSales.map((sale, i) => `
    <li class="bg-white p-4 rounded shadow">
      <div class="font-semibold">Sale #${i + 1} - ₱${sale.total.toFixed(2)}</div>
      <div class="text-sm text-gray-500 mb-1">${sale.date || 'No Date'}</div>
      <ul class="ml-4 text-sm text-gray-700">
        ${sale.items.map(p => `<li>${p.name} - ₱${p.price.toFixed(2)}</li>`).join('')}
      </ul>
    </li>
  `).join('');

  filteredSales.forEach(sale => {
    itemsSold += sale.items.length;
    totalRevenue += sale.total;
    sale.items.forEach(item => {
      productCount[item.name] = (productCount[item.name] || 0) + 1;
    });
  });

  document.getElementById('total-products').textContent = inventory.length;
  document.getElementById('total-sales').textContent = '₱' + totalRevenue.toFixed(2);
  document.getElementById('items-sold').textContent = itemsSold;
  document.getElementById('avg-sale').textContent = '₱' + (filteredSales.length ? (totalRevenue / filteredSales.length) : 0).toFixed(2);

  const dailySales = {};
  filteredSales.forEach(sale => {
    const date = new Date(sale.date).toLocaleDateString();
    dailySales[date] = (dailySales[date] || 0) + sale.total;
  });

  const chartLabels = Object.keys(dailySales);
  const chartData = Object.values(dailySales);
  if (window.salesChartInstance) window.salesChartInstance.destroy();
  window.salesChartInstance = new Chart(document.getElementById('salesChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{ label: 'Sales (₱)', data: chartData, backgroundColor: '#3B82F6' }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('top-products').innerHTML = topProducts.map(([name, qty]) => `<li>${name}: ${qty} sold</li>`).join('');
}

filterSelect.addEventListener('change', () => {
  const value = filterSelect.value;
  renderDashboard(filterSales(value === 'all' ? 'all' : parseInt(value)));
});

document.getElementById('export-btn').addEventListener('click', () => {
  showToast('Exported JSON successfully');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(salesHistory, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.href = dataStr;
  dlAnchor.download = "sales-history.json";
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  showToast('Exported CSV successfully');
  if (!salesHistory.length) return;
  const header = 'Date,Product,Price';
  const rows = salesHistory.flatMap(sale => sale.items.map(item => `${sale.date || ''},${item.name},${item.price.toFixed(2)}`));
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales-history.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all sales data?')) {
    localStorage.removeItem('sales');
    showToast('Sales data reset');
    setTimeout(() => location.reload(), 1000);
  }
});

// Check admin session first
function checkAdminSession() {
    const session = JSON.parse(sessionStorage.getItem('session'));
    if (!session || session.userType !== 'admin' || Date.now() > session.expiryTime) {
        // Invalid or expired session, redirect to login
        window.location.href = '/landing/pages/login.html';
        return false;
    }
    return true;
}

// Redirect if not admin
if (!checkAdminSession()) {
    throw new Error('Unauthorized access');
}

window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    renderDashboard(salesHistory);
  }, 1000);
});
