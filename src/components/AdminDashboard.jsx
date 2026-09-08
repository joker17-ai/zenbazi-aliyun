import { useCallback, useState } from 'react';
import { LayoutDashboard, LogOut, ReceiptText, Sparkles, UsersRound } from 'lucide-react';
import { hasAdminToken, loginAdmin, logoutAdmin } from '../utils/adminClient.js';
import { translations } from '../utils/translations.js';
import AdminOverview from './admin/AdminOverview.jsx';
import AdminPayments from './admin/AdminPayments.jsx';
import AdminReports from './admin/AdminReports.jsx';
import AdminUsers from './admin/AdminUsers.jsx';

const tabs = [
  { id: 'overview', label: '数据总览', icon: LayoutDashboard },
  { id: 'users', label: '用户管理', icon: UsersRound },
  { id: 'payments', label: '付款订单', icon: ReceiptText },
  { id: 'reports', label: '生成内容', icon: Sparkles }
];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthInputValue(monthKey) {
  return `${monthKey.slice(0, 4)}-${monthKey.slice(4, 6)}`;
}

export default function AdminDashboard({ lang, onExit }) {
  const t = translations[lang] || translations['zh-CN'];
  const copy = t.admin || translations['zh-CN'].admin;
  const isLocalBypass = Boolean(import.meta.env?.DEV);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(isLocalBypass ? true : hasAdminToken());

  const onUnauthorized = useCallback(() => {
    logoutAdmin();
    setIsAuthed(false);
    setError('登录已过期，请重新登录。');
  }, []);

  if (!isAuthed && !isLocalBypass) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-8 shadow-xl">
        <h1 className="font-serif text-2xl font-bold text-[#2C2C2C]">{copy.login}</h1>
        <p className="mt-2 text-sm text-[#2C2C2C]/65">{copy.loginHint}</p>
        <div className="mt-6 space-y-4">
          <input value={credentials.username} onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))} placeholder={copy.username} className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]" />
          <input type="password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={copy.password} className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]" />
          {error && <p className="text-sm text-[#B22222]">{error}</p>}
          <button type="button" disabled={loading} onClick={async () => { setLoading(true); setError(''); try { await loginAdmin(credentials); setIsAuthed(true); } catch (loginError) { setError(loginError.message); } finally { setLoading(false); } }} className="w-full rounded-xl bg-[#B22222] px-5 py-3 font-bold text-[#F5F0E6] transition hover:bg-[#8B1A1A] disabled:bg-[#2C2C2C]/30">{loading ? '登录中…' : copy.signIn}</button>
          <button type="button" onClick={onExit} className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-5 py-3 font-bold text-[#2C2C2C]">{t.title}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B22222]">ZenBazi / Control Room</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#2C2C2C]">{copy.title}</h1><p className="mt-2 text-sm text-[#2C2C2C]/65">用户、付款与生成内容集中管理</p>{isLocalBypass && <p className="mt-2 text-xs text-[#B22222]">本机开发模式已启用后台免登录，仅限 localhost / 127.0.0.1。</p>}</div>
          <div className="flex flex-wrap items-center gap-2"><label className="text-xs font-bold text-[#2C2C2C]/55">数据月份 <input type="month" value={monthInputValue(monthKey)} onChange={(event) => setMonthKey(event.target.value.replace('-', ''))} className="ml-2 rounded-xl border border-[#2C2C2C]/10 bg-white px-3 py-2 text-sm font-normal text-[#2C2C2C] outline-none focus:border-[#B22222]" /></label><button type="button" onClick={onExit} className="rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-2.5 text-sm font-bold text-[#2C2C2C]">{t.title}</button><button type="button" onClick={() => { logoutAdmin(); setIsAuthed(false); }} className="inline-flex items-center gap-2 rounded-xl bg-[#2C2C2C] px-4 py-2.5 text-sm font-bold text-white"><LogOut size={15} />退出</button></div>
        </div>
        <nav className="mt-7 flex gap-2 overflow-x-auto border-t border-[#2C2C2C]/10 pt-4" aria-label="后台导航">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setActiveTab(id); setError(''); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-[#B22222] text-white shadow-sm' : 'bg-white/70 text-[#2C2C2C]/65 hover:bg-white'}`}><Icon size={16} />{label}</button>)}</nav>
      </header>
      {error && <div className="rounded-2xl border border-[#B22222]/20 bg-[#B22222]/5 px-4 py-3 text-sm text-[#8B1A1A]">{error}</div>}
      {activeTab === 'overview' && <AdminOverview monthKey={monthKey} onUnauthorized={onUnauthorized} />}
      {activeTab === 'users' && <AdminUsers monthKey={monthKey} onUnauthorized={onUnauthorized} />}
      {activeTab === 'payments' && <AdminPayments monthKey={monthKey} onUnauthorized={onUnauthorized} />}
      {activeTab === 'reports' && <AdminReports monthKey={monthKey} onUnauthorized={onUnauthorized} />}
    </div>
  );
}
