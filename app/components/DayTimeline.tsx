import { AlertTriangle, ArrowDownRight, ListChecks } from "lucide-react";
import type { TripDay, TripItem } from "../data/types";
import { StatusLabel } from "./StatusLabel";

function TimelineItem({ item, index }: { item: TripItem; index: number }) {
  return (
    <article className="timeline-item" data-status={item.status}>
      <div className="timeline-item__rail" aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="timeline-item__time">{item.time}</div>
      <div className="timeline-item__main">
        <div className="timeline-item__titleline">
          <p>{item.city}</p>
          <StatusLabel status={item.status} />
        </div>
        <h3>{item.title}</h3>
        {item.arrival && (
          <p className="arrival-note"><ArrowDownRight aria-hidden="true" size={16} />{item.arrival}</p>
        )}
        {item.note && <p className="timeline-item__note">{item.note}</p>}
        {item.highlights && (
          <div className="highlight-sequence">
            <p><ListChecks aria-hidden="true" size={16} />馆内顺序</p>
            <ol>
              {item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
            </ol>
          </div>
        )}
        {item.conflict && (
          <p className="conflict-note"><AlertTriangle aria-hidden="true" size={16} />{item.conflict}</p>
        )}
      </div>
    </article>
  );
}

export function DayTimeline({ day }: { day: TripDay }) {
  const scheduled = day.items.filter((item) => item.routePoint !== false);
  const alternatives = day.items.filter((item) => item.routePoint === false);

  return (
    <section className="day-section" id={day.date}>
      <header className="day-section__header">
        <div>
          <p>{day.date}</p>
          <h2>{day.label}</h2>
        </div>
        <div>
          <strong>{day.region}</strong>
          <p>{day.summary}</p>
        </div>
        {day.detailPending && <span className="pending-detail">详细安排待补</span>}
      </header>
      <div className="timeline-list">
        {scheduled.map((item, index) => <TimelineItem item={item} index={index} key={item.id} />)}
      </div>
      {alternatives.length > 0 && (
        <div className="alternatives">
          <div className="alternatives__heading">
            <p>当日备选</p>
            <span>不加入主路线，不占用固定时段</span>
          </div>
          <div className="alternatives__list">
            {alternatives.map((item) => (
              <article key={item.id}>
                <StatusLabel status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
