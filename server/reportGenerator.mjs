import { translations } from '../src/utils/translations.js';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function generateHtmlReport(data, lang = 'zh-CN') {
  const t = translations[lang] || translations['zh-CN'];
  const { userInfo, baziResult, namingResult, report, createdAt } = data;

  const pillarsDisplay = baziResult?.pillars
    ?.map((pillar) => (typeof pillar === 'object' ? pillar.char : pillar?.char || pillar || ''))
    .reverse()
    .join(' ') || '';

  return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'zh'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lang === 'en' ? 'Life Space-Time Code Report' : '生命时空密码分析报告'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: ${lang === 'en' ? 'Georgia, serif' : 'SimSun, "Songti SC", serif'};
            background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8b4513 0%, #d2691e 100%);
            color: #fff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.8;
        }
        .section {
            margin-bottom: 35px;
        }
        .section-title {
            font-size: 22px;
            color: #8b4513;
            border-bottom: 2px solid #d2691e;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #faf8f5;
            padding: 12px 15px;
            border-radius: 8px;
            border-left: 4px solid #d2691e;
        }
        .info-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 500;
        }
        .bazi-display {
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, #fff8f0 0%, #faf0e6 100%);
            border-radius: 12px;
            margin: 20px 0;
        }
        .bazi-characters {
            font-size: 48px;
            font-weight: bold;
            color: #8b4513;
            letter-spacing: 15px;
            font-family: "KaiTi", "楷体", serif;
        }
        .zen-message {
            background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc8 100%);
            padding: 25px;
            border-radius: 12px;
            font-style: italic;
            color: #5a4a3a;
            margin: 20px 0;
            border: 1px solid #d4c4a8;
        }
        .report-content {
            white-space: pre-wrap;
            color: #333;
            font-size: 15px;
            line-height: 1.9;
        }
        .naming-info {
            background: #f0f7f0;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border: 1px solid #c8e0c8;
        }
        .footer {
            background: #f5f0e6;
            padding: 25px 30px;
            text-align: center;
            color: #777;
            font-size: 13px;
        }
        .watermark {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #bbb;
            font-size: 12px;
            border-top: 1px solid #eee;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 24px;
            }
            .bazi-characters {
                font-size: 32px;
                letter-spacing: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${lang === 'en' ? 'Life Space-Time Code Report' : '生命时空密码分析报告'}</h1>
            <p>${formatDate(createdAt || new Date().toISOString())}</p>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">${lang === 'en' ? 'Personal Information' : '基本信息'}</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Name' : '姓名'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.name || '-')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Gender' : '性别'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.gender === 'female' ? (lang === 'en' ? 'Female' : '女') : (lang === 'en' ? 'Male' : '男'))}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Birth Date' : '出生日期'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.birthDate || '-')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Birth Time' : '出生时间'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.birthTime || '-')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Birth Place' : '出生地'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.isOverseas ? userInfo?.worldCountry : userInfo?.chinaAddress || '-')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">${lang === 'en' ? 'Report Sequence' : '报告编号'}</div>
                        <div class="info-value">${escapeHtml(userInfo?.sequence || '-')}</div>
                    </div>
                </div>
            </div>

            ${pillarsDisplay ? `
            <div class="section">
                <div class="section-title">${lang === 'en' ? 'Bazi Chart' : '八字排盘'}</div>
                <div class="bazi-display">
                    <div class="bazi-characters">${escapeHtml(pillarsDisplay)}</div>
                </div>
            </div>
            ` : ''}

            ${baziResult?.zenMessage ? `
            <div class="section">
                <div class="section-title">${lang === 'en' ? 'Zen Insight' : '禅语启示'}</div>
                <div class="zen-message">
                    ${escapeHtml(baziResult.zenMessage)}
                </div>
            </div>
            ` : ''}

            ${namingResult?.fullName ? `
            <div class="section">
                <div class="section-title">${lang === 'en' ? 'Name Analysis' : '姓名分析'}</div>
                <div class="naming-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">${lang === 'en' ? 'Full Name' : '姓名'}</div>
                            <div class="info-value">${escapeHtml(namingResult.fullName)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">${lang === 'en' ? 'Overall Score' : '五格总评'}</div>
                            <div class="info-value">${namingResult.overallScore ?? namingResult.totalScore ?? 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">${lang === 'en' ? 'Three Talents' : '三才配置'}</div>
                            <div class="info-value">${escapeHtml(namingResult.sanCai?.result || namingResult.sanCai?.element || '-')}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">${lang === 'en' ? 'Element' : '五行倾向'}</div>
                            <div class="info-value">${escapeHtml(namingResult.suggestedElement || namingResult.dayMasterElement || '-')}</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${report ? `
            <div class="section">
                <div class="section-title">${lang === 'en' ? 'Life Analysis Report' : '生命分析报告'}</div>
                <div class="report-content">${escapeHtml(report)}</div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>${lang === 'en' ? 'This report is for entertainment reference only and should not be used as the basis for any major decisions.' : '本报告仅供娱乐参考，不应作为任何重大决策的依据。'}</p>
        </div>

        <div class="watermark">
            ${lang === 'en' ? 'Generated by Life Space-Time Code System' : '生命时空密码系统 • 生成时间'} ${formatDate(createdAt || new Date().toISOString())}
        </div>
    </div>
</body>
</html>`;
}
