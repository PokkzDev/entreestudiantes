"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { FaUser, FaCreditCard, FaUniversity, FaLock, FaTrash } from "react-icons/fa";
import ProfileEditSection from "@/components/configuraciones/ProfileEditSection";
import ChangePasswordSection from "@/components/configuraciones/ChangePasswordSection";
import DeleteAccountSection from "@/components/configuraciones/DeleteAccountSection";
import UniversityChangeSection from "@/components/configuraciones/UniversityChangeSection";
import PlanDetailsSection from "@/components/configuraciones/PlanDetailsSection";
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
      icon: <FaUser />
    },
    {
      id: "plan",
      label: "Plan y Suscripción",
      icon: <FaCreditCard />
    },
    {
      id: "university",
      label: "Universidad",
      icon: <FaUniversity />
    },
    {
      id: "security",
      label: "Seguridad",
      icon: <FaLock />
    },
    {
      id: "account",
      label: "Cuenta",
      icon: <FaTrash />
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
      case "plan":
        return <PlanDetailsSection />;
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
      case "plan":
        return "Plan y Suscripción";
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