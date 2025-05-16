"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PersonalInfoSection from "@/components/configuraciones/PersonalInfoSection";
import ChangePasswordSection from "@/components/configuraciones/ChangePasswordSection";
import DeleteAccountSection from "@/components/configuraciones/DeleteAccountSection";
import styles from "./page.module.css";

export default function ConfiguracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for active section
  const [activeSection, setActiveSection] = useState("personal");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <aside className={styles.sidebar}>
        <nav>
          <ul className={styles.sidebarList}>
            <li>
              <button
                className={styles.sidebarLink + (activeSection === "personal" ? " " + styles.activeSidebarLink : "")}
                onClick={() => setActiveSection("personal")}
              >
                <span className={styles.sidebarIcon}>👤</span> Información personal
              </button>
            </li>
            <li>
              <button
                className={styles.sidebarLink + (activeSection === "password" ? " " + styles.activeSidebarLink : "")}
                onClick={() => setActiveSection("password")}
              >
                <span className={styles.sidebarIcon}>🔒</span> Cambiar contraseña
              </button>
            </li>
            <li>
              <button
                className={styles.sidebarLink + (activeSection === "delete" ? " " + styles.activeSidebarLink : "")}
                onClick={() => setActiveSection("delete")}
              >
                <span className={styles.sidebarIcon}>⚠️</span> Eliminar cuenta
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Configuraciones de la cuenta</h1>
          <p className={styles.subtitle}>Administra tu información personal y preferencias de cuenta</p>
        </header>
        {activeSection === "personal" && (
          <section className={styles.sectionCard}>
            <PersonalInfoSection session={session} />
          </section>
        )}
        {activeSection === "password" && (
          <section className={styles.sectionCard}>
            <ChangePasswordSection />
          </section>
        )}
        {activeSection === "delete" && (
          <section className={styles.sectionCard}>
            <DeleteAccountSection />
          </section>
        )}
      </main>
    </div>
  );
}
