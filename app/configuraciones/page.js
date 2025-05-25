"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ProfileEditSection from "@/components/configuraciones/ProfileEditSection";
import ChangePasswordSection from "@/components/configuraciones/ChangePasswordSection";
import DeleteAccountSection from "@/components/configuraciones/DeleteAccountSection";
import UniversityChangeSection from "@/components/configuraciones/UniversityChangeSection";
import styles from "./page.module.css";

export default function ConfiguracionesPage() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState("profile");

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const navigationItems = [
    {
      id: "profile",
      label: "Perfil",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      id: "university",
      label: "Universidad",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      )
    },
    {
      id: "security",
      label: "Seguridad",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      id: "account",
      label: "Cuenta",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      )
    }
  ];

  const handleProfileUpdate = (updatedUser) => {
    // Handle any additional logic when profile is updated
    console.log("Profile updated:", updatedUser);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileEditSection 
            session={session} 
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case "university":
        return <UniversityChangeSection />;
      case "security":
        return <ChangePasswordSection />;
      case "account":
        return <DeleteAccountSection />;
      default:
        return (
          <ProfileEditSection 
            session={session} 
            onProfileUpdate={handleProfileUpdate}
          />
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "profile":
        return "Información personal";
      case "university":
        return "Universidad y Campus";
      case "security":
        return "Seguridad de la cuenta";
      case "account":
        return "Gestión de cuenta";
      default:
        return "Configuraciones";
    }
  };

  const getSectionIcon = () => {
    const item = navigationItems.find(item => item.id === activeSection);
    return item ? item.icon : null;
  };
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Configuraciones</h1>
      <div className={styles.container}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Configuraciones</h2>
          <nav>
            <ul className={styles.navList}>
              {navigationItems.map((item) => (
                <li key={item.id} className={styles.navItem}>
                  <button
                    className={`${styles.navButton} ${
                      activeSection === item.id ? styles.navButtonActive : ""
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          <h2 className={styles.contentTitle}>
            {getSectionIcon()}
            {getSectionTitle()}
          </h2>
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}