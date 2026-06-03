import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js'

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const TEXT_MUTED = '#7f8fa3'
const GRID_COLOR = 'rgba(127, 143, 163, 0.16)'
const FONT_FAMILY = "'Inter', system-ui, -apple-system, sans-serif"

Chart.defaults.color = TEXT_MUTED
Chart.defaults.font.family = FONT_FAMILY
Chart.defaults.font.size = 12

export const PRIMARY_COLOR = '#1a9dc0'

const FALLBACK_PALETTE = [
  PRIMARY_COLOR,
  '#16a76a',
  '#d49b08',
  '#d4555a',
  '#7c6ee6',
  '#e0719b',
  '#4ec3a5',
  '#c98a4b',
  '#5b8def',
  '#9aa657',
]

export function paletteColor(index: number): string {
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length] ?? PRIMARY_COLOR
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function barChartOptions(
  options: { stacked?: boolean; horizontal?: boolean } = {},
): ChartOptions<'bar'> {
  const { stacked = false, horizontal = false } = options
  const categoryAxis = { stacked, grid: { display: false } }
  const valueAxis = {
    stacked,
    beginAtZero: true,
    grid: { color: GRID_COLOR },
    ticks: {
      callback: (value: string | number) => formatCurrency(Number(value)),
    },
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: stacked, position: 'bottom' },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<'bar'>) {
            const value = (horizontal ? context.parsed.x : context.parsed.y) ?? 0
            const label = context.dataset.label
            return label ? `${label}: ${formatCurrency(value)}` : formatCurrency(value)
          },
        },
      },
    },
    scales: {
      x: horizontal ? valueAxis : categoryAxis,
      y: horizontal ? categoryAxis : valueAxis,
    },
  }
}

export function doughnutChartOptions(): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<'doughnut'>) {
            return `${context.label}: ${formatCurrency(context.parsed)}`
          },
        },
      },
    },
  }
}
