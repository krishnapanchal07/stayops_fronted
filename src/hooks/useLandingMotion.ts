import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Every animation belongs to this route's context, including media-query rebuilds. */
export function useLandingMotion(root: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .from('[data-hero]', { y: 28, opacity: 0, duration: 0.85, stagger: 0.09 })
            .from('[data-hero-art]', { scale: 0.93, y: 32, opacity: 0, duration: 1.1 }, 0.15)
            .from('[data-float]', { y: 18, opacity: 0, stagger: 0.15, duration: 0.7 }, 0.7);
          gsap.to('[data-float]', {
            y: -7,
            stagger: 0.3,
            duration: 2.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
          gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
            gsap.from(element, {
              y: 26,
              opacity: 0,
              duration: 0.7,
              scrollTrigger: { trigger: element, start: 'top 93%', once: true },
            });
          });
          gsap.from('.so-step', {
            y: 24,
            opacity: 0,
            stagger: 0.18,
            scrollTrigger: {
              trigger: '.so-steps',
              start: 'top 85%',
              end: 'bottom 65%',
              scrub: 0.5,
            },
          });
          gsap.from('.so-step-line span', {
            scaleX: 0,
            scaleY: 0,
            transformOrigin: 'top left',
            ease: 'none',
            scrollTrigger: {
              trigger: '.so-steps',
              start: 'top 85%',
              end: 'bottom 65%',
              scrub: 0.5,
            },
          });
        },
        root,
      );
      media.add(
        '(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
        () => {
          // Reveal the introduction as the section enters the viewport, before
          // pinning starts. Otherwise its visible background is completely empty.
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: '.so-story',
                start: 'top 85%',
                end: 'top 80px',
                scrub: 0.65,
                invalidateOnRefresh: true,
              },
            })
            .from('.so-story-heading-intro', { y: 38, opacity: 0, duration: 0.65 }, 0)
            .from('.so-story-center-intro', { y: 100, scale: 0.7, opacity: 0, duration: 1 }, 0);

          const story = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: '.so-story',
              start: 'top 80px',
              end: () => `+=${Math.min(window.innerHeight * 1.65, 1600)}`,
              pin: '.so-story-stage',
              scrub: 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          story
            .addLabel('introduction')
            .addLabel('expansion', 1)
            .to('.so-story-center', { scale: 0.86, y: -8, duration: 1.1 }, 'expansion')
            .from(
              '.so-story-left',
              { x: 190, y: 65, rotation: 9, opacity: 0, duration: 1.1 },
              'expansion',
            )
            .from(
              '.so-story-right',
              { x: -190, y: 65, rotation: -9, opacity: 0, duration: 1.1 },
              'expansion',
            )
            .from('.so-story-copy', { y: 22, opacity: 0, duration: 0.8 }, 'expansion+=0.3')
            .addLabel('complete', 2.1)
            .from(
              '.so-story-badge',
              { y: 32, scale: 0.8, opacity: 0, stagger: 0.14, duration: 0.65 },
              'complete',
            )
            .to('.so-story-composition', { y: -12, duration: 0.5 }, 3.35)
            .addLabel('transition', 3.85)
            .to('.so-story-composition', { scale: 0.96, y: -30, duration: 0.65 }, 'transition')
            .to('.so-story-heading', { y: -15, duration: 0.65 }, 'transition')
            .fromTo(
              '.so-story-track span',
              { scaleX: 0 },
              { scaleX: 1, duration: 4.5, transformOrigin: 'left' },
              0,
            );
        },
        root,
      );
      media.add(
        '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.from('.so-story-center', {
            y: 25,
            scale: 0.95,
            scrollTrigger: {
              trigger: '.so-story',
              start: 'top 80%',
              end: 'center center',
              scrub: 0.4,
            },
          });
        },
        root,
      );
    }, root);
    return () => {
      media.revert();
      context.revert();
    };
  }, [root]);
}
