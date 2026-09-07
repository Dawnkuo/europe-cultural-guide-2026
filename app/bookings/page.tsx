import { AlertTriangle, Check, Clock3 } from 'lucide-react';
import { SiteNav } from '../components/SiteNav';
import { StatusLabel } from '../components/StatusLabel';
import {
  bookingNeedsAction,
  bookingRecords,
  bookingReviewDate,
} from '../data/bookings';

export const dynamic = 'force-static';

const categories = ['门票', '交通', '住宿'] as const;

export default function BookingsPage() {
  const counts = {
    confirmed: bookingRecords.filter((record) => record.status === '已订')
      .length,
    pending: bookingRecords.filter(bookingNeedsAction).length,
  };

  return (
    <main className="subpage bookings-page">
      <SiteNav active="bookings" />
      <header className="page-intro page-intro--bookings">
        <p className="eyebrow">Document audit</p>
        <h1>凭证状态</h1>
        <p>
          核对日期：{bookingReviewDate}
          。已核对最新行程及49份资料（27份景点、15份交通、7份酒店）。已订不等于无需待办；收据、登机牌和晚到入住确认分别记录。未登录商家账户核验订单是否被取消或变更。
        </p>
        <dl className="audit-counts">
          <div>
            <dt>
              <Check aria-hidden="true" size={18} />
              已订项目
            </dt>
            <dd>{counts.confirmed}</dd>
          </div>
          <div>
            <dt>
              <Clock3 aria-hidden="true" size={18} />
              待办项目
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
            <table className="booking-table" aria-label={`${category}状态`}>
              <thead className="sr-only">
                <tr>
                  <th scope="col">日期与项目</th>
                  <th scope="col">状态</th>
                  <th scope="col">使用时段</th>
                  <th scope="col">备注</th>
                </tr>
              </thead>
              <tbody>
                {bookingRecords
                  .filter((record) => record.category === category)
                  .map((record) => (
                    <tr className="booking-row" key={record.id}>
                      <th scope="row">
                        <p>{record.date}</p>
                        <h3>{record.title}</h3>
                      </th>
                      <td>
                        <StatusLabel status={record.status} />
                      </td>
                      <td className="booking-row__validity">
                        {record.validity ?? '时段待核实'}
                      </td>
                      <td className="booking-row__note">
                        {bookingNeedsAction(record) && (
                          <AlertTriangle aria-hidden="true" size={15} />
                        )}
                        {record.note ?? '资料待补'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </main>
  );
}
