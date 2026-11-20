import { RoomScene } from './RoomScene';
import { ArrowDown, ArrowUpRight, Search, Sparkles, Heart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

export function HeroSection() {
  return (
    <section className="so-hero so-wrap" aria-labelledby="landing-title">
      <div className="so-hero-copy">
        <p className="so-eyebrow" data-hero>
          <span className="so-dot" /> A NEW CITY. A PLACE THAT FEELS LIKE YOU.
        </p>
        <h1 id="landing-title">
          <span data-hero>Find Your</span>
          <span data-hero>
            Perfect <em>PG Stay.</em>
          </span>
        </h1>
        <p className="so-lead" data-hero>
          Discover comfortable PGs and hostels that match your lifestyle, location, and budget. Your
          next chapter starts with a better place to stay.
        </p>
        <div className="so-explore-bar" data-hero>
          <Search size={23} />
          <div>
            <strong>A little space. A lot of possibilities.</strong>
            <span>Compare properties, sharing options & monthly rent.</span>
          </div>
          <Link to={PATHS.findRoom} className="so-button">
            Explore Rooms <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="so-hero-note" data-hero>
          <Check size={15} /> Browse rooms. Compare the details. Inquire with confidence.
        </p>
        <a className="so-scroll-cue" href="#discover">
          SCROLL TO FEEL AT HOME <ArrowDown size={16} />
        </a>
      </div>
      <div className="so-hero-art" data-hero-art>
        <span className="so-orbit" aria-hidden="true" />
        <div className="so-hero-room">
          <RoomScene />
          <span className="so-art-caption">
            A little inspiration for your next chapter · Illustration
          </span>
        </div>
        <div className="so-floating so-hero-badge" data-float>
          <span className="so-icon">
            <Heart size={22} />
          </span>
          <div>
            <strong>More than a room.</strong>
            <span>A place to belong.</span>
          </div>
        </div>
        <div className="so-floating so-hero-small" data-float>
          <Sparkles size={18} /> Make room for better living
        </div>
        <span className="so-art-index"></span>
      </div>
    </section>
  );
}
