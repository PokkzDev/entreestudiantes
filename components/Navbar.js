"use client";
import Link from "next/link";
import Image from "next/image";
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
  const [userImage, setUserImage] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userUsername, setUserUsername] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [imageKey, setImageKey] = useState(Date.now()); // For cache busting

  // Helper function to add cache busting to image URLs
  const getCacheBustedImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl.trim() === "") return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}v=${imageKey}`;
  };

  useEffect(() => {
    // Initialize user data from session and update when session changes
    if (session?.user) {
      setUserImage(session.user.image || null);
      setUserName(session.user.name || null);
      setUserUsername(session.user.username || null);
      setUserEmail(session.user.email || null);
      setImageKey(Date.now()); // Update cache busting key when session changes
    }
  }, [session?.user]); // React to changes in user data

  useEffect(() => {
    // Listen for profile updates
    function handleProfileUpdated(event) {
      const updatedUser = event.detail;
      if (updatedUser) {
        setUserImage(updatedUser.image || null);
        setUserName(updatedUser.name || null);
        setUserUsername(updatedUser.username || null);
        setUserEmail(updatedUser.email || null);
      } else {
        // Fallback to session data if no detail provided
        if (session?.user) {
          setUserImage(session.user.image || null);
          setUserName(session.user.name || null);
          setUserUsername(session.user.username || null);
          setUserEmail(session.user.email || null);
        }
      }
      setImageKey(Date.now()); // Update cache busting key
    }
    
    window.addEventListener("profile-updated", handleProfileUpdated);
    // Keep the old event for backward compatibility
    window.addEventListener("profile-image-updated", handleProfileUpdated);
    
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
      window.removeEventListener("profile-image-updated", handleProfileUpdated);
    };
  }, [session?.user]); // React to changes in user data

  useEffect(() => {
    function handleClickOutside(event) {
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
                  {userImage && userImage.trim() !== "" ? (
                    <Image
                      key={`navbar-avatar-${imageKey}`}
                      src={getCacheBustedImageUrl(userImage)}
                      alt={session.user?.name || session.user?.email || 'Avatar'}
                      fill
                      sizes="36px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src="/pageImages/placeholder_userimage.png"
                      alt="Avatar por defecto"
                      fill
                      sizes="36px"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </span>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {userUsername || userName || userEmail}
                  </span>
                  <span className={styles.userEmail}>
                    {userEmail}
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
                  </Link>                  <Link href="/mis-publicaciones" className={styles.btnDropdown} onClick={() => setDropdownOpen(false)}>
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
                    </Link>                    <Link href="/mis-publicaciones" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
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
                      {userImage && userImage.trim() !== "" ? (
                        <Image
                          key={`navbar-mobile-avatar-${imageKey}`}
                          src={getCacheBustedImageUrl(userImage)}
                          alt={session.user?.name || session.user?.email || 'Avatar'}
                          fill
                          sizes="40px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Image
                          src="/pageImages/placeholder_userimage.png"
                          alt="Avatar por defecto"
                          fill
                          sizes="40px"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div className={styles.mobileUserDetails}>
                      <span className={styles.mobileUserName}>
                        {userUsername || userName || userEmail}
                      </span>
                      <span className={styles.mobileUserEmail}>
                        {userEmail}
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
