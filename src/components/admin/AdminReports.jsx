import { useCallback, useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { getAdminReport, listAdminReports } from '../../utils/adminClient.js';
import { actionClass, DetailDrawer, formatDate, inputClass, ReportBody, StatusBadge, TableState, Pagination } from './AdminTableState.jsx';

export default function AdminReports({ monthKey, onUnauthorized }) {
  const [filters, setFilters] = useState({ query: '', status: '', page: 1, pageSize: 20 });
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [report, setReport] = useState(null);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try { setState({ loading: false, error: '', data: await listAdminReports({ month: monthKey, ...filters }) }); } catch (error) { if (error.status === 401) onUnauthorized(); setState({ loading: false, error: error.message, data: null }); }
  }, [filters, monthKey, onUnauthorized]);
  useEffect(() => { load(); }, [load]);
  const showReport = async (id) => { try { setReport(await getAdminReport(id)); } catch (error) { if (error.status === 401) onUnauthorized(); setState((current) => ({ ...current, error: error.message })); } };
  return (
    <section className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-serif text-2xl font-bold text-[#2C2C2C]">生成内容</h2><p className="mt-1 text-sm text-[#2C2C2C]/55">付款后生成的报告和禅语内容</p></div><div className="flex flex-wrap gap-2"><label className="relative"><span className="sr-only">搜索生成内容</span><Search size={16} className="absolute left-3 top-3 text-[#2C2C2C]/40" /><input className={`${inputClass} pl-9`} value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value, page: 1 }))} placeholder="姓名 / 序号 / 报告编号" /></label><select className={inputClass} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">全部状态</option><option value="generated">已生成</option><option value="processing">生成中</option><option value="failed">失败</option></select><button type="button" className={actionClass} onClick={load}>刷新</button></div></div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#2C2C2C]/8 bg-white"><TableState loading={state.loading} error={state.error} empty={!state.data?.items?.length} onRetry={load}><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-[#2C2C2C]/[.03] text-xs text-[#2C2C2C]/55"><tr><th className="px-4 py-3">报告</th><th className="px-4 py-3">用户</th><th className="px-4 py-3">付款</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">生成时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>{state.data.items.map((item) => <tr key={item.id} className="border-t border-[#2C2C2C]/[.06] text-[#2C2C2C]/80"><td className="px-4 py-4"><p className="font-bold">{item.reportTitle || '生命时空密码解析报告'}</p><p className="mt-1 text-xs text-[#2C2C2C]/45">序号 {item.sequence} · {item.id}</p></td><td className="px-4 py-4 font-bold">{item.userName || '未填写'}</td><td className="px-4 py-4"><StatusBadge status={item.paymentStatus} /></td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4 text-xs">{formatDate(item.createdAt)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => showReport(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-[#B22222] px-3 py-2 text-xs font-bold text-white"><Eye size={14} />查看生成内容</button></td></tr>)}</tbody></table><div className="px-4 pb-4"><Pagination page={state.data.page} pageSize={state.data.pageSize} total={state.data.total} onPage={(page) => setFilters((current) => ({ ...current, page }))} /></div></TableState></div>
      <DetailDrawer title={report ? (report.reportTitle || '生成内容') : ''} subtitle={report ? `序号 ${report.sequence} · ${report.status === 'generated' ? '内容已生成' : report.status}` : ''} onClose={() => setReport(null)}><ReportBody report={report} /></DetailDrawer>
    </section>
  );
}
