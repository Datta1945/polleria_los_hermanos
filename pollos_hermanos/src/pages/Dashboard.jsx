import { useState, useEffect } from "react";
import { salidasAPI, cierreCajaAPI, productosAPI } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salidas, setSalidas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [stockBajo, setStockBajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const promises = [
        salidasAPI.getStats(),
        salidasAPI.getAll(),
        cierreCajaAPI.getResumenHoy(),
        productosAPI.getLowStock(),
      ];
      const [statsRes, salidasRes, resumenRes, stockRes] = await Promise.all(promises);
      setStats(statsRes.data);
      setSalidas(salidasRes.data);
      setResumen(resumenRes.data);
      setStockBajo(stockRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (id, estado) => {
    try {
      await salidasAPI.updateStatus(id, { estado });
      loadData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCerrarCaja = async () => {
    if (!confirm("¿Cerrar la caja del dia? No se podran hacer mas modificaciones.")) return;
    setCerrando(true);
    try {
      await cierreCajaAPI.cerrar();
      alert("Caja cerrada exitosamente!");
      loadData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setCerrando(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const estadoColors = {
    pendiente: "#f59e0b",
    en_camino: "#3b82f6",
    entregado: "#10b981",
    cancelado: "#ef4444",
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Salidas</p>
          </div>
          <div className="stat-card stat-pendiente">
            <h3>{stats.pendientes}</h3>
            <p>Pendientes</p>
          </div>
          <div className="stat-card stat-camino">
            <h3>{stats.en_camino}</h3>
            <p>En Camino</p>
          </div>
          <div className="stat-card stat-entregado">
            <h3>{stats.entregados}</h3>
            <p>Entregados</p>
          </div>
          <div className="stat-card stat-ventas">
            <h3>${stats.total_ventas}</h3>
            <p>Ventas del Dia</p>
          </div>
        </div>
      )}

      {stockBajo.length > 0 && (
        <div className="section">
          <h3>Stock Bajo</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Stock Minimo</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {stockBajo.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong></td>
                    <td><strong className="stock-bajo">{p.stock}</strong></td>
                    <td>{p.stock_minimo}</td>
                    <td>{p.Proveedor?.nombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resumen && (
        <div className="section">
          <h3>Cierre de Caja del Dia</h3>
          {resumen.cerrado ? (
            <div className="form-card cierre-cerrado">
              <div className="cierre-cerrado-header">
                <span className="cierre-cerrado-badge">CERRADO</span>
              </div>
              <div className="cierre-grid">
                <div className="cierre-block">
                  <h4>Ventas por Reparto</h4>
                  <div className="cierre-item"><span>Ventas:</span><strong>{resumen.reparto_count}</strong></div>
                  <div className="cierre-item"><span>Total:</span><strong className="monto-ventas">${resumen.reparto_monto}</strong></div>
                </div>
                <div className="cierre-block">
                  <h4>Ventas de Local</h4>
                  <div className="cierre-item"><span>Ventas:</span><strong>{resumen.local_count}</strong></div>
                  <div className="cierre-item"><span>Total:</span><strong className="monto-ventas">${resumen.local_monto}</strong></div>
                </div>
              </div>
              <div className="cierre-separator"></div>
              <div className="cierre-grid">
                <div className="cierre-item"><span>Fecha:</span><strong>{resumen.fecha}</strong></div>
                <div className="cierre-item"><span>Hora cierre:</span><strong>{resumen.cierre?.hora || "-"}</strong></div>
                <div className="cierre-item"><span>Realizado por:</span><strong>{resumen.cierre?.usuario_cierre || "-"}</strong></div>
                <div className="cierre-item"><span>Salidas:</span><strong>{resumen.salidas_count}</strong></div>
                <div className="cierre-item"><span>Mercaderia Enviada:</span><strong className="monto-salida">${resumen.mercaderia_enviada}</strong></div>
                <div className="cierre-item"><span>Mercaderia Devuelta:</span><strong className="monto-regreso">${resumen.mercaderia_devuelta}</strong></div>
                <div className="cierre-item cierre-total"><span>Total General:</span><strong>${resumen.total_general}</strong></div>
              </div>
            </div>
          ) : (
            <div className="form-card">
              <div className="cierre-grid">
                <div className="cierre-block">
                  <h4>Ventas por Reparto</h4>
                  <div className="cierre-item"><span>Ventas:</span><strong>{resumen.reparto_count}</strong></div>
                  <div className="cierre-item"><span>Total:</span><strong className="monto-ventas">${resumen.reparto_monto}</strong></div>
                </div>
                <div className="cierre-block">
                  <h4>Ventas de Local</h4>
                  <div className="cierre-item"><span>Ventas:</span><strong>{resumen.local_count}</strong></div>
                  <div className="cierre-item"><span>Total:</span><strong className="monto-ventas">${resumen.local_monto}</strong></div>
                </div>
              </div>
              <div className="cierre-separator"></div>
              <div className="cierre-grid">
                <div className="cierre-item"><span>Salidas:</span><strong>{resumen.salidas_count}</strong></div>
                <div className="cierre-item"><span>Mercaderia Enviada:</span><strong className="monto-salida">${resumen.mercaderia_enviada}</strong></div>
                <div className="cierre-item"><span>Mercaderia Devuelta:</span><strong className="monto-regreso">${resumen.mercaderia_devuelta}</strong></div>
                <div className="cierre-item cierre-total"><span>Total General:</span><strong>${resumen.total_general}</strong></div>
              </div>
              <button
                className="btn btn-primary btn-full btn-cerrar-caja"
                onClick={handleCerrarCaja}
                disabled={cerrando}
              >
                {cerrando ? "Cerrando..." : "Cerrar Caja del Dia"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="section">
        <h3>Salidas de Hoy ({salidas.length})</h3>
        {salidas.length === 0 ? (
          <p className="empty">No hay salidas registradas hoy</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Camion</th>
                  <th>Cliente</th>
                  <th>Mercaderia</th>
                  <th>Total</th>
                  <th>Monto Salida</th>
                  <th>Monto Regreso</th>
                  <th>Repartidor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salidas.map((s) => (
                  <tr key={s.id}>
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
                    <td>
                      <span
                        className="estado-badge"
                        style={{ backgroundColor: estadoColors[s.estado] }}
                      >
                        {s.estado.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {s.estado === "pendiente" && (
                          <button
                            className="btn btn-sm btn-camino"
                            onClick={() => updateEstado(s.id, "en_camino")}
                          >
                            Enviar
                          </button>
                        )}
                        {s.estado === "en_camino" && (
                          <button
                            className="btn btn-sm btn-entregado"
                            onClick={() => updateEstado(s.id, "entregado")}
                          >
                            Entregado
                          </button>
                        )}
                        {s.estado !== "entregado" && s.estado !== "cancelado" && (
                          <button
                            className="btn btn-sm btn-cancel"
                            onClick={() => updateEstado(s.id, "cancelado")}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
