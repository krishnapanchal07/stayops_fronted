import { Logo } from '@/components/common/Logo';
import { PATHS } from '@/routes/paths';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => header.current?.classList.toggle('is-scrolled', window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  return (
    <header className="so-navbar" ref={header}>
      <div className="so-wrap so-nav-inner">
        <Link to={PATHS.home} aria-label="StayOps home">
          <Logo />
        </Link>
        <button
          ref={toggle}
          className="so-menu-toggle"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="landing-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="landing-navigation"
          aria-label="Public navigation"
          className={`so-nav-links ${open ? 'is-open' : ''}`}
          onClick={() => setOpen(false)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <Link to={PATHS.findRoom}>Explore Rooms</Link>
          <a href="#for-owners">For Owners</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <Link className="so-login" to={PATHS.login}>
            Login
          </Link>
          <Link className="so-button so-button-small" to={PATHS.register}>
            Sign Up <ArrowUpRight size={16} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
