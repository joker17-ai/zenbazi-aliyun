import { useEffect, useMemo, useState } from 'react';
import { decryptAdminReport, getAdminMetrics, hasAdminToken, loginAdmin, logoutAdmin } from '../utils/adminClient.js';
import { translations } from '../utils/translations.js';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#2C2C2C]/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-[#2C2C2C]/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#B22222]">{value}</p>
    </div>
  );
}

export default function AdminDashboard({ lang, onExit }) {
  const t = translations[lang] || translations['zh-CN'];
  const copy = t.admin;
  const isLocalBypass = Boolean(import.meta.env?.DEV);
  const displayValue = (value) => (value === undefined || value === null || value === '' ? '-' : String(value));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [monthKey, setMonthKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [metrics, setMetrics] = useState(null);
  const [sequence, setSequence] = useState('');
  const [decrypted, setDecrypted] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(isLocalBypass ? true : hasAdminToken());
  const accuracyLabels = {
    industry: t.feedbackPanel.industry,
    role: t.feedbackPanel.role,
    wealth: t.feedbackPanel.wealth,
    body: t.feedbackPanel.body,
    status: t.feedbackPanel.status,
    overall: copy.accuracy
  };

  const accuracyList = useMemo(() => {
    if (!metrics) return [];
    return ['industry', 'role', 'wealth', 'body', 'status', 'overall']
      .filter((key) => Object.hasOwn(metrics.feedbackAccuracy || {}, key))
      .map((key) => [accuracyLabels[key] || key, metrics.feedbackAccuracy[key]]);
  }, [accuracyLabels, copy.accuracy, metrics]);

  const refreshMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminMetrics(monthKey);
      setMetrics(data);
    } catch (err) {
      setError(isLocalBypass ? '' : err.message);
      if (!isLocalBypass && /unauthorized/i.test(err.message)) {
        setIsAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      refreshMetrics();
    }
  }, [isAuthed, monthKey]);

  if (!isAuthed && !isLocalBypass) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-8 shadow-xl">
        <h1 className="text-2xl font-bold font-serif text-[#2C2C2C]">{copy.login}</h1>
        <p className="mt-2 text-sm text-[#2C2C2C]/65">{copy.loginHint}</p>
        <div className="mt-6 space-y-4">
          <input
            value={credentials.username}
            onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
            placeholder={copy.username}
            className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]"
          />
          <input
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
            placeholder={copy.password}
            className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]"
          />
          {error && <p className="text-sm text-[#B22222]">{error}</p>}
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                await loginAdmin(credentials);
                setIsAuthed(true);
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full rounded-xl bg-[#B22222] px-5 py-3 font-bold text-[#F5F0E6] transition-colors hover:bg-[#8B1A1A] disabled:bg-[#2C2C2C]/30"
          >
            {copy.signIn}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full rounded-xl border border-[#2C2C2C]/10 bg-white px-5 py-3 font-bold text-[#2C2C2C]"
          >
            {t.title}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-[#2C2C2C]">{copy.title}</h1>
            <p className="mt-2 text-sm text-[#2C2C2C]/65">{copy.subtitle}</p>
            {isLocalBypass && (
              <p className="mt-2 text-xs text-[#B22222]">本机开发模式已启用后台免登录，仅限 localhost / 127.0.0.1。</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onExit}
              className="rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 text-sm font-bold text-[#2C2C2C]"
            >
              {t.title}
            </button>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                setIsAuthed(false);
                setMetrics(null);
              }}
              className="rounded-xl bg-[#2C2C2C] px-4 py-3 text-sm font-bold text-white"
            >
              {copy.signOut}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
            placeholder={copy.month}
            className="rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]"
          />
          <button
            type="button"
            onClick={refreshMetrics}
            disabled={loading}
            className="rounded-xl bg-[#B22222] px-5 py-3 font-bold text-[#F5F0E6] disabled:bg-[#2C2C2C]/30"
          >
            {copy.refresh}
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-[#B22222]/20 bg-[#B22222]/5 px-4 py-3 text-[#B22222]">{error}</div>}

      {metrics && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label={copy.totalRecords} value={metrics.totalRecords} />
            <StatCard label={copy.paidUsers} value={metrics.paidUsers} />
            <StatCard label={copy.freeUsers} value={metrics.freeUsers} />
            <StatCard label={copy.totalCoupons} value={metrics.totalCoupons} />
            <StatCard label={copy.avgDuration} value={`${metrics.averageReportDurationMs} ms`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
              <h2 className="text-xl font-bold font-serif text-[#2C2C2C]">{copy.accuracy}</h2>
              <div className="mt-5 space-y-4">
                {accuracyList.map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[#2C2C2C]/70">{key}</span>
                      <span className="font-bold text-[#B22222]">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white">
                      <div className="h-2 rounded-full bg-[#B22222]" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
              <h2 className="text-xl font-bold font-serif text-[#2C2C2C]">{copy.decryptTitle}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <input
                  value={sequence}
                  onChange={(event) => setSequence(event.target.value)}
                  placeholder={copy.sequence}
                  className="min-w-[12rem] flex-1 rounded-xl border border-[#2C2C2C]/10 bg-white px-4 py-3 outline-none focus:border-[#B22222]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const data = await decryptAdminReport(Number(sequence));
                      setDecrypted(data.notebook);
                    } catch (err) {
                      setError(isLocalBypass ? '' : err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !sequence}
                  className="rounded-xl bg-[#B22222] px-5 py-3 font-bold text-[#F5F0E6] disabled:bg-[#2C2C2C]/30"
                >
                  {copy.decrypt}
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2C2C2C]/55">{copy.decryptedReport}</h3>
                <pre className="mt-3 max-h-[22rem] overflow-auto rounded-2xl bg-white p-4 text-xs leading-6 text-[#2C2C2C]/80">
                  {decrypted ? JSON.stringify(decrypted, null, 2) : '—'}
                </pre>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
            <h2 className="text-xl font-bold font-serif text-[#2C2C2C]">{copy.latestRecords}</h2>
            <div className="mt-5 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C2C2C]/10 text-left text-[#2C2C2C]/60">
                    <th className="px-3 py-2">{copy.sequence}</th>
                    <th className="px-3 py-2">{copy.ip}</th>
                    <th className="px-3 py-2">{t.name}</th>
                    <th className="px-3 py-2">{t.cloud.planLabel}</th>
                    <th className="px-3 py-2">{copy.birthBazi}</th>
                    <th className="px-3 py-2">{copy.birthPlace}</th>
                    <th className="px-3 py-2">{t.gender}</th>
                    <th className="px-3 py-2">{t.cloud.couponLabel}</th>
                    <th className="px-3 py-2">{copy.mediaSource}</th>
                    <th className="px-3 py-2">{copy.avgDuration}</th>
                    <th className="px-3 py-2">{copy.accuracy}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.latestRecords.map((item) => (
                    <tr key={item.sequence} className="border-b border-[#2C2C2C]/5">
                      <td className="px-3 py-2">{item.sequence}</td>
                      <td className="px-3 py-2">{displayValue(item.ip)}</td>
                      <td className="px-3 py-2">{displayValue(item.name)}</td>
                      <td className="px-3 py-2 uppercase">{displayValue(item.plan)}</td>
                      <td className="px-3 py-2">{displayValue(item.birthBazi)}</td>
                      <td className="px-3 py-2">{displayValue(item.birthPlace)}</td>
                      <td className="px-3 py-2">{displayValue(item.gender)}</td>
                      <td className="px-3 py-2">{displayValue(item.couponBalance)}</td>
                      <td className="px-3 py-2">{displayValue(item.mediaSource)}</td>
                      <td className="px-3 py-2">{displayValue(item.reportDurationMs)}</td>
                      <td className="px-3 py-2">{displayValue(item.accuracyOverall)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
