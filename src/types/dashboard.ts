export interface StatMetric {
  id: string;
  label: string;
  value: string;
  hint?: string;
  trend?: {
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  tone: 'primary' | 'info' | 'success' | 'warning' | 'danger';
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface OccupancySlice {
  name: string;
  value: number;
}

export interface PendingPaymentRow {
  id: string;
  tenant: string;
  room: string;
  amount: number;
  dueDate: string;
  status: 'Overdue' | 'Due';
}

export interface ComplaintRow {
  id: string;
  title: string;
  room: string;
  status: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
}

export interface PropertyOccupancy {
  id: string;
  name: string;
  occupied: number;
  total: number;
}

export interface AdminDashboardData {
  stats: StatMetric[];
  occupancy: {
    percent: number;
    occupied: number;
    vacant: number;
    slices: OccupancySlice[];
  };
  monthlyRevenue: ChartPoint[];
  recentActivity: ActivityItem[];
  pendingPayments: PendingPaymentRow[];
  recentComplaints: ComplaintRow[];
  occupancyByProperty: PropertyOccupancy[];
}

export interface TenantPaymentItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'Due' | 'Paid' | 'Upcoming' | 'Overdue';
}

export interface TenantDashboardData {
  room: string;
  stats: StatMetric[];
  rent: {
    total: number;
    paid: number;
    testPaid: number;
    due: number;
    dueDate: string;
  };
  upcomingPayments: TenantPaymentItem[];
}

export interface DueTodayItem {
  id: string;
  tenant: string;
  room: string;
  amount: number;
}

export interface PaymentMethodShare {
  name: string;
  value: number;
}

export interface AccountantDashboardData {
  stats: StatMetric[];
  collectionTrend: ChartPoint[];
  dueToday: DueTodayItem[];
  recentPayments: ActivityItem[];
  paymentMethods: PaymentMethodShare[];
}

export interface MaintenanceTaskRow {
  id: string;
  title: string;
  room: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Completed';
}

export interface MaintenanceDashboardData {
  stats: StatMetric[];
  recentTasks: MaintenanceTaskRow[];
}

export interface WardenDashboardData {
  stats: StatMetric[];
  occupancy: {
    percent: number;
    occupied: number;
    vacant: number;
    slices: OccupancySlice[];
  };
}
