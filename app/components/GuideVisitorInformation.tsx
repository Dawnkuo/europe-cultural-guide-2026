'use client';

import {
  Accessibility,
  Armchair,
  ArrowRightLeft,
  ArrowUpRight,
  Backpack,
  Camera,
  ChevronDown,
  DoorOpen,
  Footprints,
  Mail,
  MapPin,
} from 'lucide-react';
import { visitorInformation } from '../data/visitor-information';
import { withBasePath } from '../lib/paths';
import { useGuideExperience } from './GuideExperience';

const topicIcons = {
  entrance: DoorOpen,
  transfer: ArrowRightLeft,
  bags: Backpack,
  accessibility: Accessibility,
  camera: Camera,
  rest: Armchair,
  post: Mail,
  stairs: Footprints,
};

export function GuideVisitorInformation({ slug }: { slug: string }) {
  const information = visitorInformation[slug];
  const experience = useGuideExperience();
  if (!information) return null;

  return (
    <div className="guide-visitor-information">
      <div className="guide-visitor-information__topics">
        {information.topics.map((topic) => {
          const Icon = topicIcons[topic.icon];
          return (
            <article key={topic.id} id={`visitor-${topic.id}`}>
              <h3>
                <Icon size={21} aria-hidden="true" />
                {topic.title}
              </h3>
              {topic.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {(topic.places || topic.guides) && (
                <div className="guide-visitor-information__links">
                  {experience &&
                    topic.places?.map((place) => {
                      const available = experience.plan?.places.some(
                        (p) => p.id === place.id,
                      );
                      return (
                        <button
                          key={place.id}
                          type="button"
                          disabled={!available}
                          title={
                            available
                              ? `地图定位：${place.label}`
                              : experience.planFailed
                                ? '地图暂不可用'
                                : '地图正在载入'
                          }
                          onClick={() => experience.locatePlace(place.id)}
                        >
                          <MapPin size={16} aria-hidden="true" />
                          {place.label}
                        </button>
                      );
                    })}
                  {topic.guides?.map((guide) => (
                    <a
                      key={guide.slug}
                      href={withBasePath(
                        `/guides/${guide.slug}/#guide-practical`,
                      )}
                    >
                      {guide.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="guide-visitor-information__faq">
        <h3>常见问题</h3>
        {information.questions.map((question) => (
          <details key={question.id} id={`visitor-question-${question.id}`}>
            <summary>
              {question.question}
              <ChevronDown size={19} aria-hidden="true" />
            </summary>
            <div>
              {question.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="guide-visitor-information__date">
        <time dateTime={information.verifiedAt}>{information.verifiedAt}</time>{' '}
        更新
      </p>
    </div>
  );
}
