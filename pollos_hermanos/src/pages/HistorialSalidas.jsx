import { useState, useEffect } from "react";
import { salidasAPI } from "../api";

export default function HistorialSalidas() {
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalidas();
  }, []);

  const loadSalidas = async () => {
    try {
      const res = await salidasAPI.getAll();
      setSalidas(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta salida? El stock se restaurará.")) return;
    try {
      await salidasAPI.delete(id);
      loadSalidas();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const estadoColors = {
    pendiente: "#f59e0b",
    en_camino: "#3b82f6",
    entregado: "#10b981",
    cancelado: "#ef4444",
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <h2>Historial de Salidas de Camión</h2>

      {salidas.length === 0 ? (
        <p className="empty">No hay salidas registradas</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Camión</th>
                <th>Cliente</th>
                <th>Mercadería</th>
                <th>Total</th>
                <th>Monto Salida</th>
                <th>Monto Regreso</th>
                <th>Repartidor</th>
                <th>Creado por</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salidas.map((s) => (
                <tr key={s.id}>
                  <td>{s.fecha}</td>
                  <td><strong>{s.camion}</strong></td>
                  <td>
                    {s.cliente_nombre}
                    <br />
                    <small>{s.cliente_direccion || ""}</small>
                  </td>
                  <td>
                    {s.SalidaCamionItems?.map((item) => (
                      <span key={item.id} className="badge">
                        {item.cantidad}x {item.Producto?.nombre}
                      </span>
                    ))}
                  </td>
                  <td><strong>${s.precio_total}</strong></td>
                  <td>{s.monto_salida ? <strong className="monto-salida">${s.monto_salida}</strong> : "-"}</td>
                  <td>{s.monto_regreso ? <strong className="monto-regreso">${s.monto_regreso}</strong> : "-"}</td>
                  <td>{s.repartidor_asignado?.nombre || "-"}</td>
                  <td>{s.creado_por?.nombre || "-"}</td>
                  <td>
                    <span
                      className="estado-badge"
                      style={{ backgroundColor: estadoColors[s.estado] }}
                    >
                      {s.estado.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {s.estado === "pendiente" && (
                      <button
                        className="btn btn-sm btn-cancel"
                        onClick={() => handleDelete(s.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
