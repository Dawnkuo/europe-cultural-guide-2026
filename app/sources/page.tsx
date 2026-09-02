import { ExternalLink, FileCheck2 } from 'lucide-react';
import { SiteNav } from '../components/SiteNav';
import { sourceRecords } from '../data/sources';

export const dynamic = 'force-static';

export default function SourcesPage() {
  return (
    <main className="subpage sources-page">
      <SiteNav active="sources" />
      <header className="page-intro page-intro--sources">
        <p className="eyebrow">Provenance & licences</p>
        <h1>资料来源</h1>
        <p>
          行程顺序来自腾讯文档，固定时间以正式票据为准，营业时间等动态信息只采用机构官网。内容最后核验于2026年9月2日。
        </p>
      </header>
      <div className="source-ledger">
        {sourceRecords.map((source, index) => (
          <article key={source.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <FileCheck2 aria-hidden="true" size={22} />
            <div>
              <p>{source.institution}</p>
              <h2>{source.title}</h2>
            </div>
            <p>{source.note}</p>
            {source.url ? (
              <a
                href={source.url}
                rel="noreferrer"
                target="_blank"
                aria-label={`打开${source.title}`}
              >
                <ExternalLink aria-hidden="true" size={18} />
              </a>
            ) : (
              <span className="source-local">本地资料</span>
            )}
          </article>
        ))}
      </div>
      <section className="source-policy">
        <div>
          <h2>隐私处理</h2>
          <p>
            网站不收录票价、姓名、订单号、座位号、二维码、酒店门禁信息和在线登记链接。
          </p>
        </div>
        <div>
          <h2>图片许可</h2>
          <p>
            文化图片来自Wikimedia
            Commons等可授权来源；每张图的作者和许可记录在站点图像署名清单。
          </p>
        </div>
        <div>
          <h2>离线范围</h2>
          <p>
            行程、提醒、城市章节与凭证状态可离线读取；机构官网链接仍需要网络连接。
          </p>
        </div>
      </section>
    </main>
  );
}
