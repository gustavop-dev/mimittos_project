import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn() },
}))

jest.mock('../../../lib/services/analyticsAdminService', () => ({
  analyticsAdminService: {
    getDashboard: jest.fn(),
    exportOrdersCSV: jest.fn(),
  },
}))

jest.mock('recharts', () => ({
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

import { api } from '../../../lib/services/http'
import { analyticsAdminService } from '../../../lib/services/analyticsAdminService'
import BackofficePage from '../page'

const mockApi = api as jest.Mocked<typeof api>
const mockGetDashboard = analyticsAdminService.getDashboard as jest.Mock

describe('BackofficeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: null })
    mockGetDashboard.mockResolvedValue(null)
  })

  it('renders the Dashboard h1 heading', () => {
    render(<BackofficePage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders quick links to all backoffice sections', () => {
    render(<BackofficePage />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/backoffice/pedidos')
    expect(hrefs).toContain('/backoffice/peluches')
    expect(hrefs).toContain('/backoffice/categorias')
    expect(hrefs).toContain('/backoffice/usuarios')
  })

  it('shows loading metrics state initially', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}))
    render(<BackofficePage />)
    expect(screen.getByText('Cargando métricas...')).toBeInTheDocument()
  })

  it('shows KPI cards after metrics load', async () => {
    mockApi.get.mockResolvedValue({
      data: { new_orders: 5, in_production: 3, pending_dispatch: 2, confirmed_deposits: 150000 },
    })
    render(<BackofficePage />)
    await waitFor(() => {
      expect(screen.getByText('Pedidos nuevos hoy')).toBeInTheDocument()
    })
  })
})
