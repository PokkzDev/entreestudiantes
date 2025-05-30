"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { chileanUniversities } from "@/utils/unicampus";
import styles from "./UniversityChangeSection.module.css";
import buttonStyles from "@/styles/buttons.module.css";

export default function UniversityChangeSection() {
  const { data: session, update } = useSession();
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setUserInfo(session.user);
      setUniversity(session.user.university || "");
      setCampus(session.user.campus || "");
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!university || !campus) {
      setMessage("Debes seleccionar una universidad y un campus.");
      setMessageType("error");
      return;
    }

    // Check if the values are the same as current
    if (university === userInfo?.university && campus === userInfo?.campus) {
      setMessage("Los valores seleccionados son los mismos que los actuales.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/configuraciones/university", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          university,
          campus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar universidad y campus");
      }

      // Update session
      await update({
        ...session,
        user: {
          ...session.user,
          university: data.user.university,
          campus: data.user.campus,
          universityChangeCount: data.user.universityChangeCount,
        },
      });

      setUserInfo(data.user);
      setMessage("Universidad y campus actualizados exitosamente.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const remainingChanges = 3 - (userInfo?.universityChangeCount || 0);
  const canChange = remainingChanges > 0;

  return (
    <div className={styles.section}>
      <div className={styles.form}>
        {/* Current Information Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Información actual</h4>
          <div className={styles.currentInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Universidad:</span>
              <span className={styles.infoValue}>{userInfo?.university || "No especificada"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Campus:</span>
              <span className={styles.infoValue}>{userInfo?.campus || "No especificado"}</span>
            </div>
          </div>
        </div>

        {/* Change University Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Cambiar universidad y campus</h4>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="university" className={styles.label}>
                  Universidad
                </label>
                <select
                  id="university"
                  name="university"
                  required
                  value={university}
                  onChange={(e) => {
                    setUniversity(e.target.value);
                    setCampus(""); // Reset campus when university changes
                  }}
                  disabled={!canChange || loading}
                  className={styles.select}
                >
                  <option value="">Selecciona tu universidad</option>
                  {chileanUniversities.map((uni) => (
                    <option key={uni.name} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="campus" className={styles.label}>
                  Campus
                </label>
                <select
                  id="campus"
                  name="campus"
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  disabled={!university || !canChange || loading}
                  className={styles.select}
                >
                  <option value="">
                    {university ? 'Selecciona tu campus' : 'Primero selecciona una universidad'}
                  </option>
                  {university && 
                    chileanUniversities
                      .find(uni => uni.name === university)
                      ?.campuses.map((campusName) => (
                        <option key={campusName} value={campusName}>
                          {campusName}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>
          </div>
          
          <div className={styles.changeInfo}>
            <small className={`${styles.fieldHint} ${!canChange ? styles.limitReached : ''}`}>
              {canChange 
                ? `Cambios restantes: ${remainingChanges}` 
                : "Has alcanzado el límite máximo de cambios"
              }
            </small>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            type="submit"
            disabled={!canChange || loading || !university || !campus}
            className={`${buttonStyles.primary} ${loading ? buttonStyles.loading : ''}`}
            onClick={handleSubmit}
          >
            {loading ? "Actualizando..." : "Guardar cambios"}
          </button>
        </div>

        {!canChange && (
          <div className={styles.limitReachedContainer}>
            <p>Has alcanzado el límite de cambios de universidad y campus.</p>
            <p>Si necesitas realizar más cambios, contacta al soporte.</p>
          </div>
        )}
      </div>
    </div>
  );
} 