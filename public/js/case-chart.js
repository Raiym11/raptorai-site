var keyPoints = [0, 4, 5, 12];
// На узком экране 13 подписей не помещаются — показываем только эти месяцы
var mobileTicks = [0, 3, 5, 8, 10, 12];
function isNarrow(chart) { return chart.width < 520; }
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
    layout: { padding: { top: 24, left: 8, right: 16 } },
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
          font: function(ctx) { return { size: isNarrow(ctx.chart) ? 11 : 9 }; },
          autoSkip: false,
          maxRotation: 0,
          callback: function(value, index) {
            var label = this.getLabelForValue(value);
            if (!isNarrow(this.chart)) return label;
            if (mobileTicks.indexOf(index) === -1) return '';
            // «Янв '26» → две строки: «Янв» и «2026»
            var parts = label.split(" '");
            return [parts[0], '20' + parts[1]];
          }
        }
      },
      y: { display: false }
    }
  }
});
