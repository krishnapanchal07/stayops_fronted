import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'primary';
export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
