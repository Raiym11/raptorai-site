var keyPoints = [0, 4, 5, 12];
new Chart(document.getElementById('salesCaseChart'), {
  type: 'line',
  plugins: [ChartDataLabels],
  data: {
    labels: ["Авг '25","Сен '25","Окт '25","Ноя '25","Дек '25","Янв '26","Фев '26","Мар '26","Апр '26","Май '26","Июн '26","Июл '26","Авг '26"],
    datasets: [{
      data: [90,110,105,106,120,155,145,207,192,290,335,515,753],
      borderColor: '#00D4FF',
      borderWidth: 2,
      pointRadius: function(ctx) { return keyPoints.includes(ctx.dataIndex) ? 4 : 0; },
      pointHoverRadius: 5,
      pointBackgroundColor: '#00D4FF',
      tension: 0.35,
      fill: true,
      backgroundColor: 'rgba(0,212,255,0.12)'
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 24 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#00D4FF',
        font: { size: 12, weight: '600' },
        align: 'top',
        offset: 8,
        formatter: function(value, ctx) {
          return keyPoints.includes(ctx.dataIndex) ? value : '';
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#8899AA',
          font: { size: 9 },
          autoSkip: false,
          maxRotation: 0
        }
      },
      y: { display: false }
    }
  }
});
