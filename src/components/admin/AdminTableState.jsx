import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false });
}

export function formatCurrency(minor = 0, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(Number(minor || 0) / 100);
}

const statusLabels = {
  paid: '已付款', pending: '待付款', failed: '失败', closed: '已关闭',
  unpaid: '未付款', generated: '已生成', processing: '生成中'
};

export function StatusBadge({ status }) {
  const positive = ['paid', 'generated'].includes(status);
  const negative = ['failed', 'closed'].includes(status);
  const tone = positive
    ? 'border-emerald-700/15 bg-emerald-700/10 text-emerald-800'
    : negative
      ? 'border-[#B22222]/20 bg-[#B22222]/10 text-[#8B1A1A]'
      : 'border-amber-700/15 bg-amber-600/10 text-amber-800';
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>{statusLabels[status] || status || '未知'}</span>;
}

export function TableState({ loading, error, empty, onRetry, children }) {
  if (loading) {
    return <div className="flex min-h-44 items-center justify-center text-sm text-[#2C2C2C]/55">正在读取数据…</div>;
  }
  if (error) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-2xl border border-[#B22222]/15 bg-[#B22222]/5 p-6 text-center">
        <p className="text-sm text-[#8B1A1A]">{error}</p>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-[#B22222] px-4 py-2 text-sm font-bold text-white">
          <RefreshCw size={15} />重新加载
        </button>
      </div>
    );
  }
  if (empty) {
    return <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-[#2C2C2C]/15 bg-white/55 p-6 text-sm text-[#2C2C2C]/50">暂无符合条件的数据</div>;
  }
  return children;
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(Number(total || 0) / pageSize));
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#2C2C2C]/60">
      <span>共 {total || 0} 条，第 {page}/{pages} 页</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-[#2C2C2C]/10 bg-white p-2 disabled:opacity-30" aria-label="上一页"><ChevronLeft size={16} /></button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-[#2C2C2C]/10 bg-white p-2 disabled:opacity-30" aria-label="下一页"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function DetailDrawer({ title, subtitle, onClose, children }) {
  if (!title) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2C2C2C]/35 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="关闭详情" />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#2C2C2C]/10 pb-5">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C]">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-[#2C2C2C]/55">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#2C2C2C]/10 bg-white p-2 text-[#2C2C2C]" aria-label="关闭"><X size={18} /></button>
        </div>
        <div className="py-6">{children}</div>
      </aside>
    </div>
  );
}

export function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-[#2C2C2C]/8 bg-white p-4">
          <dt className="text-xs font-bold tracking-wide text-[#2C2C2C]/45">{label}</dt>
          <dd className="mt-2 break-words text-sm text-[#2C2C2C]/85">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReportBody({ report }) {
  if (!report) return null;
  return (
    <div className="space-y-5">
      <DetailGrid items={[
        ['用户', report.userName], ['记录序号', report.sequence], ['付款状态', statusLabels[report.paymentStatus] || report.paymentStatus], ['生成时间', formatDate(report.createdAt)]
      ]} />
      {report.zenMessage && <blockquote className="rounded-2xl border-l-4 border-[#B22222] bg-white px-5 py-4 font-serif text-[#8B1A1A]">{report.zenMessage}</blockquote>}
      <article className="whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm leading-8 text-[#2C2C2C]/85">{report.report || '报告正文为空'}</article>
      <details className="rounded-2xl border border-[#2C2C2C]/10 bg-white p-4 text-xs text-[#2C2C2C]/60">
        <summary className="cursor-pointer font-bold">排查信息</summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap">{JSON.stringify({ id: report.id, monthKey: report.monthKey, sessionId: report.sessionId, notebookKey: report.notebookKey }, null, 2)}</pre>
      </details>
    </div>
  );
}

export const inputClass = 'rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/10';
export const actionClass = 'rounded-xl bg-[#B22222] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#8B1A1A] disabled:opacity-40';
