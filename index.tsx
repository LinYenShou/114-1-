import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import FormDashboard from './FormDashboard';
import TaipeiDashboard from './TaipeiDashboard';

// === DashboardIndexViewer：由 index 自動載入對應 components ===
function DashboardIndexViewer({
  baseUrl,
  city,
  dashIndex,
  limit = 4,
}: {
  baseUrl: string;
  city: string;
  dashIndex: string;
  limit?: number;
}) {
  const [componentIds, setComponentIds] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError('');
      setComponentIds([]);
      try {
        const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/dashboard?city=${encodeURIComponent(city)}`;
        const res = await fetch(url);
        const data = await res.json();
        const group = data?.data?.[city];
        if (!Array.isArray(group)) throw new Error('Unexpected dashboard payload.');
        const entry = group.find((x: any) => x?.index === dashIndex);
        if (!entry) throw new Error(`Index "${dashIndex}" not found under city="${city}".`);
        // Note: For display, we cap the limit at 12 to prevent excessive rendering.
        const effectiveLimit = Math.max(1, Math.min(12, limit)); 
        const ids: number[] = Array.isArray(entry.components) ? entry.components : [];
        if (!cancelled) setComponentIds(ids.slice(0, effectiveLimit));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, city, dashIndex, limit]);

  // ✅ 渲染區（只保留這一個 return）
  return (
    <div style={styles.cardSection}>
      <h4 style={styles.sectionTitle}>
        {city.toUpperCase()} / {dashIndex.toUpperCase()} Components
      </h4>
      <p style={styles.sectionSubtitle}>
        載入前 {limit} 個元件，共找到 {componentIds.length} 個。
      </p>
      {loading && <div style={{ opacity: 0.7, color: '#374151' }}>Loading dashboard configuration…</div>}
      {error && <div style={{ color: '#EF4444', padding: 8, background: '#FEE2E2', borderRadius: 8 }}>Error: {error}</div>}
      {!loading && !error && componentIds.length === 0 && (
        <div style={{ opacity: 0.7, color: '#6B7280' }}>No components found. Please check city/index or API.</div>
      )}
      <div style={styles.componentGrid}>
        {componentIds.map((id) => (
          <div key={id} style={styles.componentCard}>
            <div style={styles.componentCardTitle}>
              Component <span style={{ fontWeight: 700 }}>#{id}</span>
            </div>
            <TaipeiDashboard
              apiUrl={`${baseUrl.replace(/\/+$/, '')}/api/v1/component/${id}/chart?city=${encodeURIComponent(city)}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
} // ✅ function 正確結束


// === HomeScreen ===
export default function HomeScreen() {
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:4000');
  const [service, setService] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [submittedUrl, setSubmittedUrl] = useState<string>(baseUrl);

  const [dashCity, setDashCity] = useState<string>('taipei');
  const [dashIndex, setDashIndex] = useState<string>('traffic');
  const [dashLimit, setDashLimit] = useState<number>(4);
  const [dashBuildKey, setDashBuildKey] = useState<number>(0);

  const previewUrl = useMemo(() => {
    const s = service.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    const q = query.trim().replace(/^\?+/, '');
    let url = baseUrl.trim().replace(/\/+$/, '');
    if (s) url += `/${s}`;
    if (q) url += `?${q}`;
    return url;
  }, [baseUrl, service, query]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSubmittedUrl(previewUrl);
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F0F4F8', dark: '#1E293B' }} // Adjusted light background
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Header */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ color: styles.primaryColor }}>
          Taipei Smart Dashboard Demo
        </ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Info */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">城市資料 API 互動介面</ThemedText>
        <ThemedText style={{ color: '#4B5563' }}>
          以下為台北市智慧儀表板 API 的互動示範。您可以調整 URL、服務路徑與查詢參數，即時載入不同資料。
        </ThemedText>
      </ThemedView>

      {/* 區域 1: 儀表板建構與載入 */}
      <ThemedView style={styles.sectionContainer}>
        {/* Dashboard Builder */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Dashboard Builder 儀表板配置</h3>
          <p style={styles.cardSubtitle}>選擇城市與 Index，載入對應的儀表板元件清單。</p>
          <div style={styles.dashBuilderGrid}>
            <label style={styles.label}>
              <span>City 城市</span>
              <select value={dashCity} onChange={(e) => setDashCity(e.target.value)} style={inputStyle}>
                <option value="taipei">taipei (台北市)</option>
                <option value="metrotaipei">metrotaipei (北北基生活圈)</option>
              </select>
            </label>
            <label style={styles.label}>
              <span>Index 儀表板索引</span>
              <select value={dashIndex} onChange={(e) => setDashIndex(e.target.value)} style={inputStyle}>
                <option value="traffic">traffic (交通)</option>
                <option value="metro">metro (捷運)</option>
                <option value="youbike">youbike (公共自行車)</option>
                <option value="planning">planning (城市規劃)</option>
                <option value="services">services (公共服務)</option>
                <option value="disaster-prevention">disaster-prevention (防災)</option>
                <option value="climate-change">climate-change (氣候變遷)</option>
              </select>
            </label>
            <label style={styles.label}>
              <span>Limit 數量限制</span>
              <input
                type="number"
                min={1}
                max={12}
                value={dashLimit}
                onChange={(e) =>
                  setDashLimit(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
                }
                style={inputStyle}
              />
            </label>
            <div style={{ alignSelf: 'flex-end' }}>
              <button type="button" style={buttonStyle} onClick={() => setDashBuildKey((k) => k + 1)}>
                Build & Load
              </button>
            </div>
          </div>
          {dashBuildKey > 0 && (
            <DashboardIndexViewer
              key={`${dashCity}-${dashIndex}-${dashBuildKey}`}
              baseUrl={baseUrl}
              city={dashCity}
              dashIndex={dashIndex}
              limit={dashLimit}
            />
          )}
        </div>
      </ThemedView>

      {/* 區域 2: API Request Builder 與結果 */}
      <ThemedView style={styles.sectionContainer}>
        {/* API Builder */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>API Request Builder API 請求</h3>
          <p style={styles.cardSubtitle}>自訂 API 請求參數，提交後即時載入結果。</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              <span>Base URL 基礎網址</span>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:4000"
                style={inputStyle}
              />
            </label>
            <label style={styles.label}>
              <span>快速範例 Quick Examples</span>
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'v1-dashboards-city') {
                    setService('api/v1/dashboard');
                    setQuery('city=taipei');
                  // ⬇️⬇️⬇️ 這裡開始修改元件 ID ⬇️⬇️⬇️
                  } else if (v === 'v1-component-60') {
                    setService('api/v1/component/60/chart');
                    setQuery('city=taipei');
                  } else if (v === 'v1-component-68') {
                    setService('api/v1/component/68/chart');
                    setQuery('city=taipei');
                  } else if (v === 'v1-component-217') {
                    setService('api/v1/component/217/chart');
                    setQuery('city=taipei');
                  // ⬆️⬆️⬆️ 這裡結束修改元件 ID ⬆️⬆️⬆️
                  } else {
                    setService('');
                    setQuery('');
                  }
                }}
                style={inputStyle}
              >
                <option value="">— 選擇範例以填入 Service Path 與 Query —</option>
                <option value="v1-dashboards-city">Dashboards 清單 (api/v1/dashboard)</option>
                {/* ⬇️⬇️⬇️ 這裡開始修改元件 ID 顯示名稱 ⬇️⬇️⬇️ */}
                <option value="v1-component-60">元件 #60 資料 (api/v1/component/60/chart)</option>
                <option value="v1-component-68">元件 #68 資料 (api/v1/component/68/chart)</option>
                <option value="v1-component-217">元件 #217 資料 (api/v1/component/217/chart)</option>
                {/* ⬆️⬆️⬆️ 這裡結束修改元件 ID 顯示名稱 ⬆️⬆️⬆️ */}
              </select>
            </label>
            <label style={styles.label}>
              <span>Service Path 服務路徑 (e.g. `api/v1/component/57/chart`)</span>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="api/v1/component/60/chart" // Placeholder also updated
                style={inputStyle}
              />
            </label>
            <label style={styles.label}>
              <span>Query String 查詢參數 (e.g. `city=taipei&lang=zh`)</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="city=taipei"
                style={inputStyle}
              />
            </label>
            <div style={styles.formFooter}>
              <code style={styles.previewText}>Preview URL: {previewUrl}</code>
              <button type="submit" style={buttonStyle}>Submit & Load API Result</button>
            </div>
          </form>
        </div>

        {/* API Result Preview (TaipeiDashboard) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>API Result Preview 視覺化結果</h3>
          <p style={styles.cardSubtitle}>
            `TaipeiDashboard` 元件會嘗試以圖表形式視覺化 GET 請求結果。
          </p>
          <TaipeiDashboard apiUrl={submittedUrl} />
        </div>
        
        {/* API Result Preview (FormDashboard) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Full Request & Response 詳細資訊</h3>
          <p style={styles.cardSubtitle}>
            允許自訂 Method, Header, Body 等，並查看完整的 API Response。
          </p>
          <FormDashboard
            defaultUrl={submittedUrl}
            defaultMethod="GET"
            hint="可以修改 method、Header 或 Body 觀察回應差異。"
          />
        </div>
      </ThemedView>
    </ParallaxScrollView>
  );
}

/* --- Styles (Optimized) --- */
const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8, // Slightly smaller radius
  border: '1px solid #D1D5DB', // Gray-300
  fontSize: 14,
  outline: 'none',
  width: '100%', // Ensure full width
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)', // Subtle inner shadow
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};
const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8, // Square-like button
  background: '#3B82F6', // Standard Blue-500
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(59,130,246,0.3)', // Stronger shadow
  transition: 'background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
  // hover simulation (only affects web, but good practice):
  // '&:hover': { background: '#2563EB', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }
};
const styles: any = {
  primaryColor: '#3B82F6',
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  stepContainer: { gap: 8, marginBottom: 24 },
  sectionContainer: { marginBottom: 24, gap: 16 }, // New container for grouping
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
  card: {
    background: '#fff',
    borderRadius: 12, // More moderate radius
    padding: 24, // More padding
    border: '1px solid #E5E7EB', // Gray-200
    boxShadow: '0 6px 16px rgba(0,0,0,0.08)', // Stronger, smoother shadow
    marginBottom: 20,
  },
  cardTitle: { margin: 0, color: '#1F2937', fontSize: 20, fontWeight: 700 }, // Darker title
  cardSubtitle: { margin: '4px 0 16px', fontSize: 14, opacity: 0.7, color: '#4B5563' }, // Better subtitle style
  form: { display: 'grid', gap: 16 }, // More spacing between form elements
  label: { display: 'grid', gap: 6, fontSize: 14, fontWeight: 600, color: '#374151' }, // Better label style
  formFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  previewText: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    opacity: 0.9,
    padding: '8px 0',
    color: '#4B5563',
    maxWidth: '100%',
    overflowX: 'auto',
  },

  // Dashboard Specific Styles
  dashBuilderGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
    gap: 16, // More gap
    marginBottom: 20,
  },
  cardSection: {
    marginTop: 20,
    padding: 16,
    borderTop: '1px solid #F3F4F6',
    background: '#F9FAFB', // Light background for the section
    borderRadius: 8,
  },
  sectionTitle: {
    margin: '0 0 4px',
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 700,
  },
  sectionSubtitle: {
    margin: '0 0 12px',
    fontSize: 13,
    opacity: 0.8,
    color: '#4B5563',
  },
  componentGrid: { 
    display: 'grid', 
    gap: 16, 
    marginTop: 12 
  },
  componentCard: {
    border: '1px solid #D1D5DB', // Gray-300
    borderRadius: 10,
    padding: 16,
    background: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  componentCardTitle: {
    fontWeight: 600, 
    color: '#3B82F6', 
    marginBottom: 10, 
    fontSize: 15,
    borderBottom: '1px dotted #E5E7EB',
    paddingBottom: 6,
  },
};