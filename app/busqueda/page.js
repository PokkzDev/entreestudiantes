"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard } from "react-icons/fa";
import Image from "next/image";
import { getCategoryLabel, getProductCategories, getServiceCategories } from "../../lib/categoryOptions";

export default function Busqueda() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("");
  const [tipos, setTipos] = useState([]);
  // Nuevo estado para controlar la búsqueda manual
  const [buscar, setBuscar] = useState(false);
  
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

  // Obtener categorías según el tipo seleccionado
  const getCategoriasByTipo = () => {
    if (tipo === "producto") {
      return getProductCategories().flatMap(group => group.options);
    } else if (tipo === "servicio") {
      return getServiceCategories().flatMap(group => group.options);
    } else {
      // Si no hay tipo seleccionado, mostrar todas las categorías
      return [
        ...getProductCategories().flatMap(group => group.options),
        ...getServiceCategories().flatMap(group => group.options)
      ];
    }
  };

  // Cuando cambia el tipo, resetear la categoría
  const handleTipoChange = (e) => {
    setTipo(e.target.value);
    setCategoria("");
  };

  // Nueva función para buscar manualmente
  const handleBuscar = () => {
    setBuscar(prev => !prev); // Cambia el estado para disparar el useEffect
  };

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoria) params.append("categoria", categoria);
      if (q) params.append("q", q);
      if (tipo) params.append("tipo", tipo);
      const res = await fetch(`/api/busqueda?${params.toString()}`);
      const data = await res.json();
      setProductos(data.publicaciones || []);
      setCategorias(data.categorias || []);
      setTipos(data.tipos || []);
      setLoading(false);
    }
    fetchProductos();
  }, [buscar]); // Solo buscar cuando se presiona el botón

  return (
    <div className={styles.busquedaContainer}>
      <h1 className={styles.busquedaHeader}>Buscar en Entre Estudiantes</h1>
      <div className={styles.busquedaFiltros}>
        <select
          className={styles.busquedaSelect}
          value={tipo}
          onChange={e => setTipo(e.target.value)}
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
          {getCategoriasByTipo().map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <input
          className={styles.busquedaInput}
          type="text"
          placeholder="Buscar por nombre, descripción o tags"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className={styles.busquedaButton} onClick={handleBuscar}>Buscar</button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className={styles.busquedaGrid}>
          {productos.length === 0 ? (
            <p className={styles.busquedaEmpty}>No hay publicaciones disponibles.</p>
          ) : (
            productos.map(prod => {
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
                <div key={prod.id} className={styles.busquedaCard} data-type={prod.type} onClick={() => window.location.href = `/publicacion/${prod.id}`} style={{ cursor: 'pointer' }}>
                  <span className={styles.tipoLabel}>{prod.type === 'producto' ? 'Producto' : 'Servicio'}</span>
                  {prod.images && prod.images.length > 0 ? (
                    <Image
                      src={prod.images.split(",")[0]}
                      alt={prod.title}
                      width={300}
                      height={200}
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                      priority={false}
                    />
                  ) : (
                    <div className={styles.noImage}>Sin imagen</div>
                  )}
                  <h3>{prod.title}</h3>
                  <p className={styles.categoria}><b>Categoría:</b> {getCategoryLabel(prod.category)}</p>
                  <p>{prod.description}</p>
                  {prod.price && <p className={styles.precio}><b>Precio:</b> ${formatNumber(prod.price)}</p>}
                  <p className={styles.contacto}>
                    {contactoHref ? (
                      <a href={contactoHref} target="_blank" rel="noopener noreferrer" className="whatsapp-link">{contactoIcon}</a>
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
    </div>
  );
}
