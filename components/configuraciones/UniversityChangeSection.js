"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { chileanUniversities } from "@/utils/unicampus";
import styles from "./UniversityChangeSection.module.css";

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
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Actualiza tu universidad y campus. Puedes cambiar esta información hasta 3 veces.
        </p>
        <div className={styles.changeCounter}>
          <span className={`${styles.counter} ${!canChange ? styles.counterLimit : ""}`}>
            Cambios restantes: {remainingChanges}/3
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.currentInfo}>
          <h4>Información actual:</h4>
          <p><strong>Universidad:</strong> {userInfo?.university || "No especificada"}</p>
          <p><strong>Campus:</strong> {userInfo?.campus || "No especificado"}</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="university" className={styles.label}>
            Nueva Universidad
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

        <div className={styles.formGroup}>
          <label htmlFor="campus" className={styles.label}>
            Nuevo Campus
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

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canChange || loading || !university || !campus}
          className={styles.submitButton}
        >
          {loading ? "Actualizando..." : "Actualizar Universidad y Campus"}
        </button>

        {!canChange && (
          <div className={styles.limitReached}>
            <p>Has alcanzado el límite de cambios de universidad y campus.</p>
            <p>Si necesitas realizar más cambios, contacta al soporte.</p>
          </div>
        )}
      </form>
    </div>
  );
} 