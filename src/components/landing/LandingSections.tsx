import { Logo } from '@/components/common/Logo';
import { PATHS } from '@/routes/paths';
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  BookOpen,
  Wifi,
  Snowflake,
  Shirt,
  WashingMachine,
  Sparkles,
  ClipboardList,
  LogIn,
  Headphones,
  MessageCircle,
  Check,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const reasons = [
  {
    icon: Search,
    title: 'Easy PG Discovery',
    text: 'Less searching, more finding. Explore available rooms in one place.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Room and Rent Transparency',
    text: 'See the rent, amenities, and room details before you inquire.',
  },
  {
    icon: Users,
    title: 'Flexible Sharing Options',
    text: 'A space to yourself or room for company. Compare your options.',
  },
  {
    icon: ShieldCheck,
    title: 'Organized Visitor Security',
    text: 'Visitor requests and entry records help property teams stay organized.',
  },
];
export function WhyStayOpsSection() {
  return (
    <section className="so-section so-why" id="about">
      <div className="so-wrap">
        <div className="so-section-top">
          <div>
            <p className="so-eyebrow">THOUGHTFUL BY DESIGN</p>
            <h2>
              A better stay starts
              <br />
              with <em>the little things.</em>
            </h2>
          </div>
          <p className="so-side-copy">
            StayOps brings room discovery and organized property management together, so your next
            move feels a little easier.
          </p>
        </div>
        <div className="so-feature-grid">
          {reasons.map(({ icon: Icon, title, text }, index) => (
            <article className="so-feature" data-reveal key={title}>
              <span className="so-feature-number">0{index + 1}</span>
              <span className="so-icon">
                <Icon size={25} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
const steps = [
  { icon: Search, title: 'Search', text: 'Explore PGs based on your requirements.' },
  {
    icon: SlidersHorizontal,
    title: 'Compare',
    text: 'Review rooms, rent, amenities, and availability.',
  },
  {
    icon: MessageCircle,
    title: 'Inquire',
    text: 'Submit a room inquiry and connect with the property team.',
  },
];
export function HowItWorksSection() {
  return (
    <section className="so-section so-wrap so-how" id="how-it-works">
      <div className="so-center">
        <p className="so-eyebrow">YOUR NEXT MOVE, MADE SIMPLE</p>
        <h2>
          Three steps. <em>A fresh start.</em>
        </h2>
      </div>
      <div className="so-steps">
        <div className="so-step-line" aria-hidden="true">
          <span />
        </div>
        {steps.map(({ icon: Icon, title, text }, index) => (
          <article className="so-step" key={title}>
            <span className="so-step-icon">
              <Icon size={26} />
              <small>0{index + 1}</small>
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
const amenities = [
  { icon: Wifi, title: 'Wi-Fi' },
  { icon: Snowflake, title: 'AC' },
  { icon: BookOpen, title: 'Study Table' },
  { icon: Shirt, title: 'Wardrobe' },
  { icon: WashingMachine, title: 'Laundry' },
  { icon: Sparkles, title: 'Housekeeping' },
  { icon: ShieldCheck, title: 'CCTV' },
  { icon: Building2, title: 'Power Backup' },
];
export function AmenitiesSection() {
  return (
    <section className="so-section so-amenities">
      <div className="so-wrap">
        <div className="so-center">
          <p className="so-eyebrow">THE EVERYDAY ESSENTIALS</p>
          <h2>
            Small comforts. <em>Big difference.</em>
          </h2>
          <p>
            Look for the things that make a place yours.
            <br />
            Amenities vary by room and property; check each listing.
          </p>
        </div>
        <div className="so-amenity-grid">
          {amenities.map(({ icon: Icon, title }) => (
            <div data-reveal key={title}>
              <Icon size={28} />
              <span>{title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
const operations = [
  {
    icon: ShieldCheck,
    title: 'Visitor Management',
    text: 'Keep visitor requests and approvals in one place.',
  },
  {
    icon: LogIn,
    title: 'Entry/Exit Tracking',
    text: 'Help security teams maintain organized movement logs.',
  },
  {
    icon: ClipboardList,
    title: 'Organized Property Operations',
    text: 'Give property teams a shared view of day-to-day work.',
  },
  {
    icon: Headphones,
    title: 'Resident Support',
    text: 'Track support requests and maintenance issues.',
  },
];
export function SecuritySection() {
  return (
    <section className="so-section so-wrap so-security" id="for-owners">
      <div className="so-operations-art" data-reveal>
        <div className="so-operations-top">
          <Logo />
          <span>PLATFORM CAPABILITIES</span>
        </div>
        <div className="so-operations-shield">
          <ShieldCheck size={64} strokeWidth={1} />
        </div>
        <h3>
          A little more organized.
          <br />A lot more peace of mind.
        </h3>
        <div className="so-operations-row">
          <span className="so-icon">
            <Users size={20} />
          </span>
          <div>
            <strong>Visitor requests</strong>
            <span>Manage approvals in one place</span>
          </div>
          <Check size={19} />
        </div>
        <div className="so-operations-row">
          <span className="so-icon">
            <ClipboardList size={20} />
          </span>
          <div>
            <strong>Property operations</strong>
            <span>Keep everyday work connected</span>
          </div>
          <Check size={19} />
        </div>
        <p>Illustrative view of StayOps tools</p>
      </div>
      <div>
        <p className="so-eyebrow">FOR RESIDENTS. FOR PROPERTY TEAMS.</p>
        <h2>
          Designed for better,
          <br />
          <em>safer living.</em>
        </h2>
        <p className="so-section-intro">
          A comfortable stay goes beyond four walls. StayOps helps teams coordinate the work behind
          everyday living.
        </p>
        <div className="so-operations-list">
          {operations.map(({ icon: Icon, title, text }) => (
            <div data-reveal key={title}>
              <Icon size={21} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="so-fine-print">
          Platform tools support property operations; physical security and services depend on the
          individual property.
        </p>
        <Link className="so-text-link" to={PATHS.login}>
          Property team login <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
export function LandingCTA() {
  return (
    <section className="so-cta so-wrap">
      <div data-reveal>
        <p className="so-eyebrow">A NEW CHAPTER IS WAITING</p>
        <h2>
          Ready to find
          <br />
          <em>your next PG?</em>
        </h2>
        <p>Find your space. Send an inquiry. Take the next step.</p>
        <div className="so-cta-actions">
          <Link className="so-button" to={PATHS.findRoom}>
            Explore Rooms <ArrowUpRight size={18} />
          </Link>
          <Link className="so-button so-button-outline" to={PATHS.register}>
            Get Started <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="so-fine-print">Get started with the existing StayOps inquiry form.</p>
      </div>
      <span className="so-cta-mark" aria-hidden="true">
        S
      </span>
    </section>
  );
}
export function LandingFooter() {
  return (
    <footer className="so-footer so-wrap">
      <div className="so-footer-bottom">
        <span>© {new Date().getFullYear()} StayOps</span>
        <span>Made for the way you live.</span>
        <a href="#landing-main">Back to top ↑</a>
      </div>
    </footer>
  );
}
