import { useState } from "react";
import HistorialVentasPage from "./HistorialVentasPage";
import HistorialSalidas from "./HistorialSalidas";

export default function HistorialPage() {
  const [activeTab, setActiveTab] = useState("ventas");

  return (
    <div>
      <h2>Historial</h2>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "ventas" ? "active" : ""}`}
          onClick={() => setActiveTab("ventas")}
        >
          Historial de Ventas
        </button>
        <button
          className={`tab-btn ${activeTab === "salidas" ? "active" : ""}`}
          onClick={() => setActiveTab("salidas")}
        >
          Historial de Salidas
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "ventas" && <HistorialVentasPage />}
        {activeTab === "salidas" && <HistorialSalidas />}
      </div>
    </div>
  );
}
