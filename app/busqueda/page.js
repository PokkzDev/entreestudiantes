"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard, FaFlag } from "react-icons/fa";
import Image from "next/image";
import ReportModal from "@/components/ReportModal";
import { getCategoryLabel, getProductCategories, getServiceCategories } from "../../lib/categoryOptions";

export default function Busqueda() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("");
  const [tipos, setTipos] = useState([]);
  const [universidad, setUniversidad] = useState("");
  const [campus, setCampus] = useState("");
  const [universidades, setUniversidades] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [userUniversity, setUserUniversity] = useState(null);
  const [userCampus, setUserCampus] = useState(null);
  // Nuevo estado para controlar la búsqueda manual
  const [buscar, setBuscar] = useState(false);
  // Estados para el modal de reportes
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPublication, setReportingPublication] = useState(null);
  
  // Función para formatear números con puntos para separar miles y comas para decimales
  const formatNumber = (num) => {
    if (!num) return '0';
    
    // Separar la parte entera y decimal
    let [integerPart, decimalPart] = num.toString().split('.');
    
    // Formatear la parte entera con puntos como separadores de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Devolver el número formateado with coma para decimales si existe parte decimal
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  };

  // Obtener categorías según el tipo seleccionado (manteniendo la estructura de grupos)
  const getCategoriasByTipo = () => {
    if (tipo === "producto") {
      return getProductCategories();
    } else if (tipo === "servicio") {
      return getServiceCategories();
    } else {
      // Si no hay tipo seleccionado, mostrar todas las categorías
      return [
        ...getProductCategories(),
        ...getServiceCategories()
      ];
    }
  };

  // Cuando cambia el tipo, resetear la categoría
  const handleTipoChange = (e) => {
    setTipo(e.target.value);
    setCategoria("");
  };

  // Fetch productos (initial load or manual search)
  const fetchProductos = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoria) params.append("categoria", categoria);
    if (q) params.append("q", q);
    if (tipo) params.append("tipo", tipo);
    if (universidad) params.append("universidad", universidad);
    if (campus) params.append("campus", campus);
    const res = await fetch(`/api/busqueda?${params.toString()}`);
    const data = await res.json();
    setProductos(data.publicaciones || []);
    setCategorias(data.categorias || []);
    setTipos(data.tipos || []);
    setUniversidades(data.universidades || []);
    setCampuses(data.campuses || []);
    
    // Set user defaults only on initial load
    if (!userUniversity && data.userUniversity) {
      setUserUniversity(data.userUniversity);
      setUniversidad(data.userUniversity);
    }
    if (!userCampus && data.userCampus) {
      setUserCampus(data.userCampus);
      setCampus(data.userCampus);
    }
    
    setLoading(false);
  };

  // Initial search on mount
  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nueva función para buscar manualmente
  const handleBuscar = fetchProductos;

  // Nueva función para resetear filtros y traer todos los resultados
  const handleReset = () => {
    setTipo("");
    setCategoria("");
    setQ("");
    setUniversidad("");
    setCampus("");
    setTimeout(() => {
      fetchProductosWithEmptyFilters();
    }, 0);
  };

  const fetchProductosWithEmptyFilters = async () => {
    setLoading(true);
    const res = await fetch(`/api/busqueda`);
    const data = await res.json();
    setProductos(data.publicaciones || []);
    setCategorias(data.categorias || []);
    setTipos(data.tipos || []);
    setUniversidades(data.universidades || []);
    setCampuses(data.campuses || []);
    setLoading(false);
  };

  // Función para manejar el reporte de publicaciones
  const handleReport = (e, publicacion) => {
    e.stopPropagation(); // Evitar que se abra la publicación
    setReportingPublication(publicacion);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportingPublication(null);
  };

  return (
    <div className={styles.busquedaContainer}>
      <h1 className={styles.busquedaHeader}>Buscar en Entre Estudiantes</h1>
      <div className={styles.busquedaFiltros}>
        <div style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center' }}>
          <select
            className={styles.busquedaSelect}
            value={tipo}
            onChange={handleTipoChange}
          >
            <option value="">Todos los tipos</option>
            <option value="producto">Productos</option>
            <option value="servicio">Servicios</option>
          </select>
          <select
            className={styles.busquedaSelect}
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {getCategoriasByTipo().map(groupObj => (
              <optgroup key={groupObj.group} label={groupObj.group}>
                {groupObj.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            className={styles.busquedaSelect}
            value={universidad}
            onChange={e => {
              setUniversidad(e.target.value);
              setCampus(""); // Reset campus when university changes
            }}
          >
            <option value="">Todas las universidades</option>
            {universidades.map(uni => (
              <option key={uni} value={uni}>
                {uni}
                {uni === userUniversity ? " (Tu universidad)" : ""}
              </option>
            ))}
          </select>
          <select
            className={styles.busquedaSelect}
            value={campus}
            onChange={e => setCampus(e.target.value)}
          >
            <option value="">Todos los campus</option>
            {campuses.map(camp => (
              <option key={camp} value={camp}>
                {camp}
                {camp === userCampus ? " (Tu campus)" : ""}
              </option>
            ))}
          </select>
          <input
            className={styles.busquedaInput}
            type="text"
            placeholder="Buscar por nombre o descripción"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBuscar();
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
          <button className={styles.busquedaButton} onClick={handleBuscar}>Buscar</button>
          <button
            className={styles.busquedaResetButton}
            type="button"
            onClick={handleReset}
            style={{ marginLeft: '0.5rem', background: '#e2e8f0', color: '#334155', fontWeight: 500 }}
          >
            Resetear
          </button>
        </div>
      </div>
      {(universidad || campus) && (
        <div className={styles.busquedaInfo}>
          <div className={styles.busquedaInfoIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className={styles.busquedaInfoText}>
            <strong>Filtrando por:</strong>
            {universidad && <span> Universidad: {universidad}</span>}
            {campus && <span> Campus: {campus}</span>}
            {universidad === userUniversity && campus === userCampus && (
              <span className={styles.busquedaInfoHighlight}> (Tu institución)</span>
            )}
          </div>
        </div>
      )}
      
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className={styles.busquedaGrid}>
          {productos.length === 0 ? (
            <p className={styles.busquedaEmpty}>No hay publicaciones disponibles.</p>
          ) : (
            productos.map((prod, index) => {
              let contactoHref = null;
              let contactoIcon = null;
              if (prod.contactMethod === 'whatsapp') {
                const phone = prod.contactInfo.replace(/[^\d]/g, '');
                contactoHref = phone ? `https://wa.me/${phone}` : null;
                contactoIcon = <FaWhatsapp className={styles.contactIcon + ' whatsapp-icon'} style={{ color: '#25D366' }} />;
              } else if (prod.contactMethod === 'email') {
                contactoHref = `mailto:${prod.contactInfo}`;
                contactoIcon = <FaEnvelope className={styles.contactIcon} style={{ color: '#6366f1' }} />;
              } else if (prod.contactMethod === 'telefono') {
                const phone = prod.contactInfo.replace(/[^\d]/g, '');
                contactoHref = phone ? `tel:${phone}` : null;
                contactoIcon = <FaPhone className={styles.contactIcon} style={{ color: '#10b981' }} />;
              } else {
                contactoIcon = <FaRegAddressCard className={styles.contactIcon} style={{ color: '#64748b' }} />;
              }
              return (
                <div 
                  key={prod.id} 
                  className={styles.busquedaCard} 
                  data-type={prod.type} 
                  onClick={() => window.location.href = `/publicacion/${prod.id}`} 
                  style={{ 
                    cursor: 'pointer',
                    '--card-index': index
                  }}
                >
                  <span className={styles.tipoLabel}>{prod.type === 'producto' ? 'Producto' : 'Servicio'}</span>
                  <button
                    className={styles.reportButtonCard}
                    onClick={(e) => handleReport(e, prod)}
                    title="Reportar publicación"
                  >
                    <FaFlag />
                  </button>
                  {prod.images && prod.images.length > 0 ? (
                    <div className={styles.imageContainer}>
                      <Image
                        src={(() => {
                          const img = prod.images.split(",")[0].trim();
                          if (!img) return "";
                          // If already starts with /images/ or is a full URL, use as is
                          if (img.startsWith("/images/") || img.startsWith("http")) return img;
                          // Otherwise, prepend /images/
                          return `/images/${img.replace(/^\/+/, "")}`;
                        })()}
                        alt={prod.title}
                        width={300}
                        height={200}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        priority={index < 4}
                      />
                    </div>
                  ) : (
                    <div className={styles.noImage}>Sin imagen</div>
                  )}
                  <h3>{prod.title}</h3>
                  <p className={styles.categoria}><b>Categoría:</b> {getCategoryLabel(prod.category)}</p>
                  {(prod.university || prod.campus) && (
                    <p className={styles.universidad}>
                      <b>Institución:</b> {prod.university}
                      {prod.campus && <span> - {prod.campus}</span>}
                    </p>
                  )}
                  <p>{prod.description}</p>
                  {prod.price && <p className={styles.precio}><b>Precio:</b> ${formatNumber(prod.price)}</p>}
                  <p className={styles.contacto}>
                    {contactoHref ? (
                      <a
                        href={contactoHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-link"
                        onClick={e => e.stopPropagation()} // Prevent card click when clicking the link
                      >
                        {contactoIcon}
                      </a>
                    ) : (
                      <span>{contactoIcon}</span>
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {/* Modal de reporte */}
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        publicacionId={reportingPublication?.id}
        publicacionTitle={reportingPublication?.title}
      />
    </div>
  );
}
