"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch analytics data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe, status]);

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          <h2>No hay datos disponibles</h2>
          <p>No se pudieron cargar los datos de analytics.</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeframeLabel = (tf) => {
    switch (tf) {
      case '24hours': return 'Últimas 24 horas';
      case '7days': return 'Últimos 7 días';
      case '30days': return 'Últimos 30 días';
      case '90days': return 'Últimos 90 días';
      default: return 'Últimos 30 días';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics Dashboard</h1>
        <div className={styles.timeframeSelector}>
          <label htmlFor="timeframe">Período:</label>
          <select 
            id="timeframe"
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className={styles.select}
          >
            <option value="24hours">Últimas 24 horas</option>
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 90 días</option>
          </select>
        </div>
      </div>

      <div className={styles.period}>
        <p>Mostrando datos para: <strong>{getTimeframeLabel(timeframe)}</strong></p>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Vistas de Página</h3>
          </div>
          <div className={styles.cardValue}>
            {formatNumber(analytics.summary.totalPageViews)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Visitantes Únicos</h3>
          </div>
          <div className={styles.cardValue}>
            {formatNumber(analytics.summary.uniqueVisitors)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Sesiones</h3>
          </div>
          <div className={styles.cardValue}>
            {formatNumber(analytics.summary.totalSessions)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Usuarios Activos</h3>
          </div>
          <div className={styles.cardValue}>
            {analytics.summary.activeSessions}
          </div>
          <div className={styles.cardSubtext}>Últimos 30 minutos</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Tasa de Rebote</h3>
          </div>
          <div className={styles.cardValue}>
            {analytics.summary.bounceRate}%
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Duración Promedio</h3>
          </div>
          <div className={styles.cardValue}>
            {analytics.summary.avgSessionDuration} min
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className={styles.section}>
        <h2>Páginas Más Visitadas</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>Página</div>
            <div>Vistas Totales</div>
            <div>Visitantes Únicos</div>
            <div>Última Visita</div>
          </div>
          {analytics.topPages.map((page, index) => (
            <div key={index} className={styles.tableRow}>
              <div className={styles.pagePath}>{page.path}</div>
              <div>{formatNumber(page.totalHits)}</div>
              <div>{formatNumber(page.uniqueHits)}</div>
              <div>{new Date(page.lastHit).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Device & Browser Stats */}
      <div className={styles.gridSection}>
        <div className={styles.section}>
          <h2>Dispositivos</h2>
          <div className={styles.statsList}>
            {Object.entries(analytics.demographics.devices).map(([device, count]) => (
              <div key={device} className={styles.statItem}>
                <span className={styles.statLabel}>
                  {device === 'mobile' ? 'Móvil' : 
                   device === 'desktop' ? 'Escritorio' : 
                   device === 'tablet' ? 'Tablet' : 'Desconocido'}
                </span>
                <span className={styles.statValue}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Navegadores</h2>
          <div className={styles.statsList}>
            {Object.entries(analytics.demographics.browsers).map(([browser, count]) => (
              <div key={browser} className={styles.statItem}>
                <span className={styles.statLabel}>
                  {browser.charAt(0).toUpperCase() + browser.slice(1)}
                </span>
                <span className={styles.statValue}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className={styles.section}>
        <h2>Actividad por Tipo</h2>
        <div className={styles.activityGrid}>
          <div className={styles.activityCard}>
            <h4>Vistas de Publicaciones</h4>
            <div className={styles.activityValue}>
              {formatNumber(analytics.summary.publicationViews)}
            </div>
          </div>
          <div className={styles.activityCard}>
            <h4>Búsquedas</h4>
            <div className={styles.activityValue}>
              {formatNumber(analytics.summary.searchActivity)}
            </div>
          </div>
          <div className={styles.activityCard}>
            <h4>Página de Registro</h4>
            <div className={styles.activityValue}>
              {formatNumber(analytics.summary.registrationActivity)}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {analytics.insights && (
        <div className={styles.section}>
          <h2>Datos Destacados</h2>
          <div className={styles.insightsList}>
            <div className={styles.insight}>
              <strong>Páginas por sesión promedio:</strong> {analytics.summary.avgPagesPerSession}
            </div>
            {analytics.insights.mostActiveHour && (
              <div className={styles.insight}>
                <strong>Hora más activa:</strong> {new Date(analytics.insights.mostActiveHour.hour).toLocaleTimeString()} 
                ({analytics.insights.mostActiveHour.hits} visitas)
              </div>
            )}
            <div className={styles.insight}>
              <strong>Sesión más larga:</strong> {analytics.insights.longestSession} minutos
            </div>
            <div className={styles.insight}>
              <strong>Máximo de páginas vistas en una sesión:</strong> {analytics.insights.maxPagesViewed}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 