'use client';
/* oxlint-disable next/no-img-element -- Local offline artwork thumbnails. */

import { ArrowDownRight, MapPin } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import { useGuideExperience } from './GuideExperience';
import { locationForSequence, workId } from '../lib/guide-experience';
import { withBasePath } from '../lib/paths';

export function GuideSequence({ guide }: { guide: GuideRecord }) {
  const experience = useGuideExperience();
  return (
    <section className="guide-section guide-sequence" id="guide-sequence">
      <div className="guide-section__heading">
        <p>03 / On site</p>
        <h2>现场顺序</h2>
        <span>只整理景点内部的观看顺序，不改变跨景点行程。</span>
      </div>
      <ol>
        {guide.sequence.map((step, index) => {
          const location = locationForSequence(guide, index, experience?.plan);
          return (
            <li key={`${step.title}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {experience &&
                  (location.places.length > 0 || location.works.length > 0) && (
                    <div className="guide-sequence__connections">
                      {location.places.map((place) => (
                        <button
                          className="guide-sequence__place"
                          key={place.id}
                          type="button"
                          onClick={() => experience.locatePlace(place.id)}
                        >
                          <MapPin aria-hidden="true" size={15} />
                          {place.name}
                        </button>
                      ))}
                      {location.works.map((work) => (
                        <button
                          className="guide-sequence__work"
                          key={workId(
                            guide.slug,
                            work,
                            guide.highlights.indexOf(work),
                          )}
                          type="button"
                          onClick={(event) =>
                            experience.openWork(
                              workId(
                                guide.slug,
                                work,
                                guide.highlights.indexOf(work),
                              ),
                              event.currentTarget,
                            )
                          }
                        >
                          {/* oxlint-disable-next-line next/no-img-element -- Local offline artwork. */}
                          {work.image && (
                            <img
                              alt=""
                              src={withBasePath(work.image)}
                              loading="lazy"
                            />
                          )}
                          <span>{work.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <ArrowDownRight aria-hidden="true" />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
