import { BrowseLayout } from '@/layouts/BrowseLayout';
import { DiscoveryLayout } from '@/layouts/DiscoveryLayout';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { lazy, Suspense } from 'react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ForbiddenPage } from '@/pages/common/ForbiddenPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { FindRoomDetailsPage } from '@/pages/find-room/FindRoomDetailsPage';
import { authRoutes } from '@/routes/authRoutes';
import { dashboardRoutes } from '@/routes/dashboardRoutes';
import { PATHS } from '@/routes/paths';
import { RootRedirect } from '@/routes/RootRedirect';
import { useRoutes } from 'react-router-dom';

const PublicPGSearchPage = lazy(() => import('@/pages/find-room/PublicPGSearchPage'));
const PublicPGDetailsPage = lazy(() => import('@/pages/find-room/PublicPGDetailsPage'));

export function AppRouter() {
  return useRoutes([
    { path: PATHS.home, element: <RootRedirect /> },
    ...authRoutes,
    {
      element: <DiscoveryLayout />,
      children: [
        {
          path: PATHS.findRoom,
          element: (
            <Suspense fallback={<LoadingSpinner label="Loading room discovery" />}>
              <PublicPGSearchPage />
            </Suspense>
          ),
        },
        {
          path: PATHS.publicPropertyDetail,
          element: (
            <Suspense fallback={<LoadingSpinner label="Loading property details" />}>
              <PublicPGDetailsPage />
            </Suspense>
          ),
        },
      ],
    },
    {
      element: <BrowseLayout />,
      children: [{ path: PATHS.findRoomDetail, element: <FindRoomDetailsPage /> }],
    },
    ...dashboardRoutes,
    {
      element: <PublicLayout />,
      children: [
        { path: PATHS.forbidden, element: <ForbiddenPage /> },
        { path: PATHS.notFound, element: <NotFoundPage /> },
      ],
    },
    {
      element: <PublicLayout />,
      children: [{ path: '*', element: <NotFoundPage /> }],
    },
  ]);
}
