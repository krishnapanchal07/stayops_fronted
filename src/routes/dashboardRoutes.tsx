import { RoleCode } from '@/constants/roles';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { routesForRoles } from '@/routes/routeConfig';
import type { RouteObject } from 'react-router-dom';

export const dashboardRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <RoleRoute allowed={[RoleCode.SUPER_ADMIN, RoleCode.OWNER]} />,
            children: routesForRoles([RoleCode.SUPER_ADMIN, RoleCode.OWNER]),
          },
          {
            element: <RoleRoute allowed={[RoleCode.WARDEN]} />,
            children: routesForRoles([RoleCode.WARDEN]),
          },
          {
            element: <RoleRoute allowed={[RoleCode.ACCOUNTANT]} />,
            children: routesForRoles([RoleCode.ACCOUNTANT]),
          },
          {
            element: <RoleRoute allowed={[RoleCode.SECURITY]} />,
            children: routesForRoles([RoleCode.SECURITY]),
          },
          {
            element: <RoleRoute allowed={[RoleCode.MAINTENANCE]} />,
            children: routesForRoles([RoleCode.MAINTENANCE]),
          },
          {
            element: <RoleRoute allowed={[RoleCode.TENANT]} />,
            children: routesForRoles([RoleCode.TENANT]),
          },
        ],
      },
    ],
  },
];
