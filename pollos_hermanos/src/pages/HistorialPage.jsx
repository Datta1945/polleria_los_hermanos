import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import HistorialVentasPage from "./HistorialVentasPage";
import HistorialSalidas from "./HistorialSalidas";
import HistorialCierres from "./HistorialCierres";

export default function HistorialPage() {
  const { user } = useAuth();
  const isAdminOrOperador = user?.role === "admin" || user?.role === "operador";
  const [activeTab, setActiveTab] = useState("ventas");

  const tabs = [
    { key: "ventas", label: "Historial de Ventas" },
  ];
  if (isAdminOrOperador) {
    tabs.push({ key: "salidas", label: "Historial de Salidas" });
    tabs.push({ key: "cierres", label: "Historial de Cierres de Caja" });
  }

  return (
    <div>
      <h2>Historial</h2>

      <div className="tabs-container">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "ventas" && <HistorialVentasPage />}
        {activeTab === "salidas" && isAdminOrOperador && <HistorialSalidas />}
        {activeTab === "cierres" && isAdminOrOperador && <HistorialCierres />}
      </div>
    </div>
  );
}
