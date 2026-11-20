import { Logo } from '@/components/common/Logo';
import { BuildingIllustration } from '@/assets/BuildingIllustration';
import { appConfig } from '@/config/app';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-10 text-white lg:flex">
        <Logo inverted />
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">{appConfig.name}</h1>
          <p className="mt-3 text-lg text-white/85">{appConfig.tagline}</p>
          <div className="mt-10">
            <BuildingIllustration />
          </div>
        </div>
        <p className="max-w-sm text-sm text-white/75">{appConfig.description}</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
            <p className="typo-secondary mt-2">{appConfig.tagline}</p>
          </div>
          <Outlet />
        </div>
      </section>
    </div>
  );
}
