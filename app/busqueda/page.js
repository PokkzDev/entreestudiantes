"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import cardStyles from "@/components/PublicationCard.module.css";
import { FaFlag, FaChevronUp } from "react-icons/fa";
import ReportModal from "@/components/ReportModal";
import PublicationCard from "@/components/PublicationCard";
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
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  });
  // Estado para el botón "scroll to top"
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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
  const fetchProductos = async (showAll = false, page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoria) params.append("categoria", categoria);
    if (q) params.append("q", q);
    if (tipo) params.append("tipo", tipo);
    if (universidad) params.append("universidad", universidad);
    if (campus) params.append("campus", campus);
    if (showAll) params.append("showAll", "true");
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    const res = await fetch(`/api/busqueda?${params.toString()}`);
    const data = await res.json();
    setProductos(data.publicaciones || []);
    setCategorias(data.categorias || []);
    setTipos(data.tipos || []);
    setUniversidades(data.universidades || []);
    setCampuses(data.campuses || []);
    
    // Set pagination data
    if (data.pagination) {
      setPagination(data.pagination);
      setCurrentPage(data.pagination.currentPage);
    }
    
    // Set user defaults only on initial load
    if (!userUniversity && data.userUniversity) {
      setUserUniversity(data.userUniversity);
    }
    if (!userCampus && data.userCampus) {
      setUserCampus(data.userCampus);
    }
    
    // Update the filter dropdowns to reflect what was actually applied
    if (data.appliedFilters) {
      if (data.appliedFilters.universidad && !universidad) {
        setUniversidad(data.appliedFilters.universidad);
      }
      if (data.appliedFilters.campus && !campus) {
        setCampus(data.appliedFilters.campus);
      }
    }
    
    setLoading(false);
  };

  // Initial search on mount
  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top button functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 200); // Show button after scrolling 200px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Nueva función para buscar manualmente
  const handleBuscar = () => {
    setCurrentPage(1);
    fetchProductos(false, 1, itemsPerPage);
  };

  // Funciones para manejar paginación
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchProductos(false, newPage, itemsPerPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchProductos(false, 1, newLimit);
  };

  // Nueva función para resetear filtros y traer todos los resultados
  const handleReset = () => {
    setTipo("");
    setCategoria("");
    setQ("");
    setUniversidad("");
    setCampus("");
    setCurrentPage(1);
    setTimeout(() => {
      fetchProductos(false, 1, itemsPerPage); // Don't show all, will apply user filters if logged in
    }, 0);
  };

  // Nueva función para ver todas las publicaciones (override user filters)
  const handleVerTodos = () => {
    setTipo("");
    setCategoria("");
    setQ("");
    setUniversidad("");
    setCampus("");
    setCurrentPage(1);
    setTimeout(() => {
      fetchProductos(true, 1, itemsPerPage); // Show all publications
    }, 0);
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
          {userUniversity && (
            <button
              className={styles.busquedaResetButton}
              type="button"
              onClick={handleVerTodos}
              style={{ marginLeft: '0.5rem', background: '#f97316', color: 'white', fontWeight: 500 }}
            >
              Ver todos
            </button>
          )}
        </div>
      </div>
      {(universidad || campus || (userUniversity && !universidad && !campus)) && (
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
            {(universidad || campus) ? (
              <>
                <strong>Filtrando por:</strong>
                {universidad && <span> Universidad: {universidad}</span>}
                {campus && <span> Campus: {campus}</span>}
                {universidad === userUniversity && campus === userCampus && (
                  <span className={styles.busquedaInfoHighlight}> (Tu institución)</span>
                )}
              </>
            ) : (
              <>
                <strong>Mostrando publicaciones de tu institución:</strong>
                <span> {userUniversity}</span>
                {userCampus && <span> - {userCampus}</span>}
                <span className={styles.busquedaInfoHighlight}> (Automático)</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          {/* Results summary and items per page selector */}
          {productos.length > 0 && (
            <div className={styles.resultsControls}>
              <div className={styles.resultsInfo}>
                Mostrando {productos.length} de {pagination.totalCount} resultados
                {pagination.totalPages > 1 && (
                  <span> (Página {pagination.currentPage} de {pagination.totalPages})</span>
                )}
              </div>
              <div className={styles.itemsPerPageSelector}>
                <label htmlFor="itemsPerPage">Mostrar: </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={e => handleItemsPerPageChange(parseInt(e.target.value))}
                  className={styles.itemsPerPageSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span> por página</span>
              </div>
            </div>
          )}

          {/* Top Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationControls}>
                <button
                  className={`${styles.paginationButton} ${!pagination.hasPrevPage ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Anterior
                </button>
                
                <div className={styles.paginationNumbers}>
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        className={`${styles.paginationNumber} ${currentPage === 1 ? styles.active : ''}`}
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className={styles.paginationEllipsis}>...</span>}
                    </>
                  )}
                  
                  {/* Show pages around current page */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum >= 1 && pageNum <= pagination.totalPages && 
                        !(currentPage > 3 && pagination.totalPages > 5 && pageNum === 1)) {
                      return (
                        <button
                          key={pageNum}
                          className={`${styles.paginationNumber} ${currentPage === pageNum ? styles.active : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show last page */}
                  {currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                    <>
                      {currentPage < pagination.totalPages - 3 && <span className={styles.paginationEllipsis}>...</span>}
                      <button
                        className={`${styles.paginationNumber} ${currentPage === pagination.totalPages ? styles.active : ''}`}
                        onClick={() => handlePageChange(pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  className={`${styles.paginationButton} ${!pagination.hasNextPage ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          <div className={styles.busquedaGrid}>
            {productos.length === 0 ? (
              <p className={styles.busquedaEmpty}>No hay publicaciones disponibles.</p>
            ) : (
              productos.map((prod, index) => (
                <PublicationCard
                  key={prod.id}
                  publication={prod}
                  index={index}
                  onActionClick={handleReport}
                  priority={index < 4}
                  actionButton={{
                    icon: <FaFlag />,
                    title: "Reportar publicación",
                    className: cardStyles.reportButtonCard
                  }}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationControls}>
                <button
                  className={`${styles.paginationButton} ${!pagination.hasPrevPage ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Anterior
                </button>
                
                <div className={styles.paginationNumbers}>
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        className={`${styles.paginationNumber} ${currentPage === 1 ? styles.active : ''}`}
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className={styles.paginationEllipsis}>...</span>}
                    </>
                  )}
                  
                  {/* Show pages around current page */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum >= 1 && pageNum <= pagination.totalPages && 
                        !(currentPage > 3 && pagination.totalPages > 5 && pageNum === 1)) {
                      return (
                        <button
                          key={pageNum}
                          className={`${styles.paginationNumber} ${currentPage === pageNum ? styles.active : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show last page */}
                  {currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                    <>
                      {currentPage < pagination.totalPages - 3 && <span className={styles.paginationEllipsis}>...</span>}
                      <button
                        className={`${styles.paginationNumber} ${currentPage === pagination.totalPages ? styles.active : ''}`}
                        onClick={() => handlePageChange(pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  className={`${styles.paginationButton} ${!pagination.hasNextPage ? styles.disabled : ''}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal de reporte */}
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        publicacionId={reportingPublication?.id}
        publicacionTitle={reportingPublication?.title}
      />

      {/* Scroll to top button */}
      {showScrollToTop && (
        <button
          className={styles.scrollToTopButton}
          onClick={scrollToTop}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <FaChevronUp />
        </button>
      )}
    </div>
  );
}
