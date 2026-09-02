import { AlertTriangle, Check, Clock3 } from 'lucide-react';
import { SiteNav } from '../components/SiteNav';
import { StatusLabel } from '../components/StatusLabel';
import { bookingRecords } from '../data/bookings';

export const dynamic = 'force-static';

const categories = ['门票', '交通', '住宿'] as const;

export default function BookingsPage() {
  const counts = {
    confirmed: bookingRecords.filter((record) => record.status === '已订')
      .length,
    pending: bookingRecords.filter((record) => record.status === '待确认')
      .length,
  };

  return (
    <main className="subpage bookings-page">
      <SiteNav active="bookings" />
      <header className="page-intro page-intro--bookings">
        <p className="eyebrow">Document audit</p>
        <h1>凭证状态</h1>
        <p>
          根据本地票据文件夹核对。这里只展示是否已确认、使用时段和行动项，不公开价格、姓名、订单号或二维码。
        </p>
        <dl className="audit-counts">
          <div>
            <dt>
              <Check aria-hidden="true" size={18} />
              已确认
            </dt>
            <dd>{counts.confirmed}</dd>
          </div>
          <div>
            <dt>
              <Clock3 aria-hidden="true" size={18} />
              待确认
            </dt>
            <dd>{counts.pending}</dd>
          </div>
        </dl>
      </header>
      <div className="booking-groups">
        {categories.map((category) => (
          <section className="booking-group" key={category}>
            <header>
              <p>{String(categories.indexOf(category) + 1).padStart(2, '0')}</p>
              <h2>{category}</h2>
              <span>
                {
                  bookingRecords.filter(
                    (record) => record.category === category,
                  ).length
                }{' '}
                项
              </span>
            </header>
            <div
              className="booking-table"
              role="table"
              aria-label={`${category}状态`}
            >
              {bookingRecords
                .filter((record) => record.category === category)
                .map((record) => (
                  <article className="booking-row" key={record.id} role="row">
                    <div>
                      <p>{record.date}</p>
                      <h3>{record.title}</h3>
                    </div>
                    <StatusLabel status={record.status} />
                    <p>{record.validity ?? '无固定入场时间'}</p>
                    <p className="booking-row__note">
                      {record.status === '待确认' && (
                        <AlertTriangle aria-hidden="true" size={15} />
                      )}
                      {record.note ?? '票据与行程匹配'}
                    </p>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
