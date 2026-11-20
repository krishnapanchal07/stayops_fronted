import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import '@/styles/discovery-banner.css';

const slides = [
  {
    title: 'Your space, beautifully sorted.',
    text: 'Find a room that feels like your own.',
    detail: 'Compare rooms, sharing options and monthly rent.',
    action: 'Explore available stays',
    amenity: '',
    image: '/images/discovery/stayops-living.jpg',
    theme: 'mint',
  },
  {
    title: 'Room to focus. Space to grow.',
    text: 'A little more space for your big plans.',
    detail: 'Explore rooms with Wi-Fi for your everyday routine.',
    action: 'Explore Wi-Fi stays',
    amenity: 'Wi-Fi',
    image: '/images/discovery/stayops-study.jpg',
    theme: 'lavender',
  },
  {
    title: 'Come home to comfort.',
    text: 'Your next chapter starts with a better stay.',
    detail: 'Discover air-conditioned rooms, then connect with the team.',
    action: 'Explore AC rooms',
    amenity: 'AC',
    image: '/images/discovery/stayops-living.jpg',
    theme: 'peach',
  },
];

export function DiscoveryCarousel({ onExplore }: { onExplore: (amenity: string) => void }) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopForMotion = () => {
      setReducedMotion(motion.matches);
    };
    const visibility = () => setHidden(document.hidden);
    motion.addEventListener('change', stopForMotion);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      motion.removeEventListener('change', stopForMotion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (reducedMotion || hidden) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      3000,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion, hidden]);
  return (
    <section
      className="so-discovery-banner"
      aria-roledescription="carousel"
      aria-label="Discover your next stay"
    >
      <h1 className="sr-only">Find your perfect PG</h1>
      <div className="so-banner-window">
        <div className="so-banner-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, i) => (
            <article
              key={slide.title}
              className={`so-banner-slide so-banner-${slide.theme}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={i !== index}
              inert={i !== index}
            >
              <img
                src={slide.image}
                alt=""
                width={1200}
                height={800}
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'auto'}
              />
              <div className="so-banner-wash" />
              <div className="so-banner-copy">
                <h2>{slide.title}</h2>
                <p className="so-banner-lead">{slide.text}</p>
                <p>{slide.detail}</p>
                <button onClick={() => onExplore(slide.amenity)}>
                  {slide.action}
                  <ArrowRight size={16} />
                </button>
              </div>
              <span className="so-banner-caption">Lifestyle concept image</span>
            </article>
          ))}
        </div>
      </div>
      <div className="so-banner-controls">
        <div className="so-banner-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
