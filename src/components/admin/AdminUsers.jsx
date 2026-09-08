import { useCallback, useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { getAdminReport, getAdminUser, listAdminUsers } from '../../utils/adminClient.js';
import { actionClass, DetailDrawer, DetailGrid, formatDate, inputClass, ReportBody, StatusBadge, TableState, Pagination } from './AdminTableState.jsx';

export default function AdminUsers({ monthKey, onUnauthorized }) {
  const [filters, setFilters] = useState({ query: '', status: '', page: 1, pageSize: 20 });
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [detail, setDetail] = useState(null);
  const [report, setReport] = useState(null);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await listAdminUsers({ month: monthKey, ...filters });
      setState({ loading: false, error: '', data });
    } catch (error) {
      if (error.status === 401) onUnauthorized();
      setState({ loading: false, error: error.message, data: null });
    }
  }, [filters, monthKey, onUnauthorized]);
  useEffect(() => { load(); }, [load]);

  const showUser = async (id) => {
    try { setDetail(await getAdminUser(id)); } catch (error) { if (error.status === 401) onUnauthorized(); setState((current) => ({ ...current, error: error.message })); }
  };
  const showReport = async (id) => {
    if (!id) return;
    try { setReport(await getAdminReport(id)); } catch (error) { if (error.status === 401) onUnauthorized(); setState((current) => ({ ...current, error: error.message })); }
  };

  return (
    <section className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="font-serif text-2xl font-bold text-[#2C2C2C]">用户管理</h2><p className="mt-1 text-sm text-[#2C2C2C]/55">查看用户资料、权益和已生成内容</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="relative"><span className="sr-only">搜索用户</span><Search size={16} className="absolute left-3 top-3 text-[#2C2C2C]/40" /><input className={`${inputClass} pl-9`} value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value, page: 1 }))} placeholder="姓名 / 序号 / 联系方式" /></label>
          <select className={inputClass} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">全部状态</option><option value="paid">已付款</option><option value="unpaid">未付款</option></select>
          <button type="button" className={actionClass} onClick={load}>刷新</button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#2C2C2C]/8 bg-white">
        <TableState loading={state.loading} error={state.error} empty={!state.data?.items?.length} onRetry={load}>
          <table className="min-w-[920px] w-full text-left text-sm"><thead className="bg-[#2C2C2C]/[.03] text-xs text-[#2C2C2C]/55"><tr><th className="px-4 py-3">用户</th><th className="px-4 py-3">序号</th><th className="px-4 py-3">方案</th><th className="px-4 py-3">付款</th><th className="px-4 py-3">联系方式</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody>{state.data.items.map((item) => <tr key={item.id} className="border-t border-[#2C2C2C]/[.06] text-[#2C2C2C]/80"><td className="px-4 py-4"><p className="font-bold">{item.name || '未填写'}</p><p className="mt-1 text-xs text-[#2C2C2C]/45">{item.sessionId}</p></td><td className="px-4 py-4">{item.sequence}</td><td className="px-4 py-4 uppercase">{item.plan || 'free'}</td><td className="px-4 py-4"><StatusBadge status={item.paymentStatus} /></td><td className="px-4 py-4 text-xs">{item.phone || item.email || '—'}</td><td className="px-4 py-4 text-xs">{formatDate(item.createdAt)}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => showUser(item.id)} className="rounded-lg border border-[#2C2C2C]/10 bg-white px-3 py-2 text-xs font-bold">查看详情</button><button type="button" disabled={!item.reportId} onClick={() => showReport(item.reportId)} className="inline-flex items-center gap-1 rounded-lg bg-[#B22222] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#2C2C2C]/20"><Eye size={14} />查看生成内容</button></div></td></tr>)}</tbody>
          </table>
          <div className="px-4 pb-4"><Pagination page={state.data.page} pageSize={state.data.pageSize} total={state.data.total} onPage={(page) => setFilters((current) => ({ ...current, page }))} /></div>
        </TableState>
      </div>

      <DetailDrawer title={detail ? `用户：${detail.name || '未填写'}` : ''} subtitle="用户详细信息" onClose={() => setDetail(null)}>{detail && <DetailGrid items={[["姓名", detail.name], ["手机号", detail.phone], ["邮箱", detail.email], ["会话编号", detail.sessionId], ["出生八字", detail.birthBazi], ["出生地", detail.birthPlace], ["性别", detail.gender], ["付款状态", detail.paymentStatus], ["支付方式", detail.latestPaymentProvider], ["优惠余额", detail.couponBalance], ["创建时间", formatDate(detail.createdAt)]]} />}</DetailDrawer>
      <DetailDrawer title={report ? (report.reportTitle || '生成内容') : ''} subtitle={report ? `序号 ${report.sequence}` : ''} onClose={() => setReport(null)}><ReportBody report={report} /></DetailDrawer>
    </section>
  );
}
