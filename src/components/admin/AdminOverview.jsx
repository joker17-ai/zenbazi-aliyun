import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CircleDollarSign, FileCheck2, FileWarning, Hourglass, Users } from 'lucide-react';
import { getAdminOverview } from '../../utils/adminClient.js';
import { formatCurrency, formatDate, StatusBadge, TableState } from './AdminTableState.jsx';

const cards = [
  ['totalUsers', '用户总数', Users],
  ['paidUsers', '已付款用户', CircleDollarSign],
  ['pendingPayments', '待付款订单', Hourglass],
  ['revenueMinor', '累计实收', BarChart3],
  ['generatedReports', '已生成内容', FileCheck2],
  ['failedReports', '生成失败', FileWarning]
];

export default function AdminOverview({ monthKey, onUnauthorized }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await getAdminOverview({ month: monthKey });
      setState({ loading: false, error: '', data });
    } catch (error) {
      if (error.status === 401) onUnauthorized();
      setState({ loading: false, error: error.message, data: null });
    }
  }, [monthKey, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  return (
    <TableState loading={state.loading} error={state.error} empty={false} onRetry={load}>
      {state.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(([key, label, Icon]) => (
              <div key={key} className="group rounded-2xl border border-[#2C2C2C]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#2C2C2C]/55">{label}</p>
                    <p className="mt-3 font-serif text-3xl font-bold text-[#B22222]">
                      {key === 'revenueMinor' ? formatCurrency(state.data[key]) : state.data[key]}
                    </p>
                  </div>
                  <span className="rounded-xl bg-[#B22222]/8 p-2.5 text-[#B22222]"><Icon size={20} /></span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#2C2C2C]">最近付款</h2>
              <div className="mt-4 space-y-3">
                {state.data.recentPayments?.length ? state.data.recentPayments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                    <div className="min-w-0"><p className="truncate font-bold text-[#2C2C2C]">{item.userName || item.id}</p><p className="mt-1 text-xs text-[#2C2C2C]/50">{formatDate(item.createdAt)}</p></div>
                    <div className="text-right"><StatusBadge status={item.status} /><p className="mt-2 text-sm font-bold text-[#B22222]">{formatCurrency(item.payableMinor, item.currency)}</p></div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-[#2C2C2C]/45">本月暂无付款记录</p>}
              </div>
            </section>
            <section className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#2C2C2C]">最近生成内容</h2>
              <div className="mt-4 space-y-3">
                {state.data.recentReports?.length ? state.data.recentReports.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                    <div className="min-w-0"><p className="truncate font-bold text-[#2C2C2C]">{item.userName || item.reportTitle}</p><p className="mt-1 text-xs text-[#2C2C2C]/50">序号 {item.sequence} · {formatDate(item.createdAt)}</p></div>
                    <StatusBadge status={item.status} />
                  </div>
                )) : <p className="py-8 text-center text-sm text-[#2C2C2C]/45">本月暂无生成内容</p>}
              </div>
            </section>
          </div>
        </div>
      )}
    </TableState>
  );
}
