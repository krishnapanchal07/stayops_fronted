import { RoomScene } from './RoomScene';
import { Wifi, Snowflake, BookOpen, Users, ShieldCheck } from 'lucide-react';

const features = [
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: Snowflake, label: 'AC' },
  { icon: BookOpen, label: 'Study Area' },
  { icon: Users, label: 'Flexible Sharing' },
  { icon: ShieldCheck, label: 'Visitor Security' },
];
export function ScrollStorySection() {
  return (
    <section className="so-story" id="discover" aria-labelledby="story-title">
      <div className="so-story-stage so-wrap">
        <div className="so-story-heading-intro">
          <div className="so-story-heading">
            <p className="so-eyebrow">SPACE TO LIVE. ROOM TO GROW.</p>
            <h2 id="story-title">
              Discover a better
              <br />
              <em>way to stay.</em>
            </h2>
          </div>
        </div>
        <div className="so-story-composition">
          <div className="so-story-side so-story-left">
            <RoomScene variant="study" />
            <span>A corner for your big ideas.</span>
          </div>
          <div className="so-story-center-intro">
            <div className="so-story-center">
              <RoomScene />
              <span>Your own everyday escape.</span>
            </div>
          </div>
          <div className="so-story-side so-story-right">
            <RoomScene variant="lounge" />
            <span>Space for new connections.</span>
          </div>
          <div className="so-story-features">
            {features.map(({ icon: Icon, label }) => (
              <span className="so-story-badge" key={label}>
                <Icon size={19} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="so-story-copy">
          <p className="so-story-message">
            Start with a room. <strong>Find your rhythm.</strong>
          </p>
          <p>
            Room and property amenities vary. Explore each listing for details.
            <br />
            Visitor management is a StayOps platform capability.
          </p>
        </div>
        <div className="so-story-track" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
