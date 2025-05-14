"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // Verificamos si el clic fue en el botón de hamburguesa para evitar conflictos
      const isHamburgerButton = event.target.closest(`.${styles.hamburgerBtn}`);
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !isHamburgerButton) {
        setMobileMenuOpen(false);
      }
    }
    
    if (dropdownOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, mobileMenuOpen]);

  // Desactivar el scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.logo}>
          <span>Entre Estudiantes</span>
        </Link>
        
        {/* Menú de navegación - versión escritorio */}
        <nav className={`${styles.navLinks} ${styles.desktopOnly}`}>
          <Link href="/" className={styles.navLink}>Inicio</Link>
          <Link href="/busqueda" className={styles.navLink}>Búsqueda</Link>
        </nav>
        
        {/* Botón hamburguesa para móvil */}
        <button 
          className={`${styles.hamburgerBtn} ${mobileMenuOpen ? styles.active : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuOpen(prevState => !prevState);
          }}
          aria-label="Menú principal"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        {/* Acciones de usuario - versión escritorio */}
        <div className={`${styles.navActions} ${styles.desktopOnly}`}>
          {loading ? null : session ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <div
                className={styles.userInfo}
                tabIndex={0}
                onClick={() => setDropdownOpen((v) => !v)}
                style={{ cursor: "pointer" }}
              >
                <span className={styles.userAvatar}>
                  {session.user?.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : session.user?.email?.charAt(0).toUpperCase()}
                </span>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {session.user?.username || session.user?.name || session.user?.email}
                  </span>
                  <span className={styles.userEmail}>
                    {session.user?.email}
                  </span>
                </div>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginLeft: 8}} aria-hidden>
                  <path d="M6 8l4 4 4-4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {dropdownOpen && (
                <div className={styles.userDropdown}>
                  <Link href="/publicar" className={styles.btnDropdown} onClick={() => setDropdownOpen(false)}>
                    Publicar
                  </Link>
                  <Link href="/mis-publicaciones" className={styles.btnDropdown} onClick={() => setDropdownOpen(false)}>
                    Mis Publicaciones
                  </Link>
                  <Link href="/configuraciones" className={styles.btnDropdown} onClick={() => setDropdownOpen(false)}>
                    Configuraciones
                  </Link>
                  <button
                    className={styles.btnDropdown}
                    onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.btnNavOutline}>Iniciar Sesión</Link>
              <Link href="/registro" className={styles.btnNavPrimary}>Registrarse</Link>
            </>
          )}
        </div>
        
        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div 
            className={styles.mobileMenuOverlay} 
            onClick={(e) => {
              // Evitar que el clic se propague a elementos superiores
              e.stopPropagation();
              setMobileMenuOpen(false);
            }}
          >
            <div 
              className={styles.mobileMenu} 
              ref={mobileMenuRef} 
              onClick={(e) => e.stopPropagation()}
            >
              <nav className={styles.mobileNav}>
                <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                  Inicio
                </Link>
                <Link href="/busqueda" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                  Búsqueda
                </Link>
                
                {/* Si el usuario está autenticado */}
                {session && (
                  <>
                    <Link href="/publicar" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                      Publicar
                    </Link>
                    <Link href="/mis-publicaciones" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                      Mis Publicaciones
                    </Link>
                    <Link href="/configuraciones" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                      Configuraciones
                    </Link>
                  </>
                )}
              </nav>
              
              <div className={styles.mobileActions}>
                {!loading && (session ? (
                  <div className={styles.mobileUserInfo}>
                    <div className={styles.mobileUserAvatar}>
                      {session.user?.name
                        ? session.user.name.charAt(0).toUpperCase()
                        : session.user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.mobileUserDetails}>
                      <span className={styles.mobileUserName}>
                        {session.user?.username || session.user?.name || session.user?.email}
                      </span>
                      <span className={styles.mobileUserEmail}>
                        {session.user?.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.mobileAuthButtons}>
                    <Link href="/login" className={styles.btnNavOutline} onClick={() => setMobileMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                    <Link href="/registro" className={styles.btnNavPrimary} onClick={() => setMobileMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </div>
                ))}
                
                {session && (
                  <button
                    className={styles.btnSignOut}
                    onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  >
                    Cerrar Sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
