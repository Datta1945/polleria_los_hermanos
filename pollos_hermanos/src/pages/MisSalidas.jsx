import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { salidasAPI } from "../api";

export default function MisSalidas() {
  const { user } = useAuth();
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regresando, setRegresando] = useState(null);
  const [itemsRegreso, setItemsRegreso] = useState([]);

  useEffect(() => {
    loadSalidas();
  }, []);

  const loadSalidas = async () => {
    try {
      const res = await salidasAPI.getMisSalidas();
      setSalidas(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (id, estado) => {
    try {
      await salidasAPI.updateStatus(id, { estado });
      loadSalidas();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const openRegresoForm = (salida) => {
    setRegresando(salida);
    const items = (salida.SalidaCamionItems || []).map((item) => ({
      productoId: item.productoId,
      nombre: item.Producto?.nombre,
      precio_unitario: parseFloat(item.precio_unitario),
      cantidad_enviada: item.cantidad,
      cantidad_regreso: 0,
    }));
    setItemsRegreso(items);
  };

  const handleCantidadRegreso = (index, value) => {
    const newItems = [...itemsRegreso];
    const cant = parseInt(value) || 0;
    newItems[index].cantidad_regreso = Math.min(cant, newItems[index].cantidad_enviada);
    setItemsRegreso(newItems);
  };

  const calcularMontoRegreso = () => {
    return itemsRegreso.reduce((sum, item) => {
      return sum + item.precio_unitario * item.cantidad_regreso;
    }, 0);
  };

  const confirmarRegreso = async () => {
    if (!regresando) return;
    try {
      const items_para_enviar = itemsRegreso
        .filter((item) => item.cantidad_regreso > 0)
        .map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad_regreso,
        }));

      await salidasAPI.registrarRegreso(regresando.id, {
        items_regreso: items_para_enviar,
      });
      setRegresando(null);
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
      <h2>Mis Salidas de Camion</h2>
      <p className="subtitle">Solo puedes cambiar el estado de tus salidas</p>

      {regresando && (
        <div className="modal-overlay" onClick={() => setRegresando(null)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Registrar Regreso - {regresando.camion}</h3>
            <p className="subtitle">Selecciona los productos que regresaron y sus cantidades</p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Enviados</th>
                    <th>Regresan</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsRegreso.map((item, index) => (
                    <tr key={item.productoId}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>${item.precio_unitario}</td>
                      <td>{item.cantidad_enviada}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad_enviada}
                          value={item.cantidad_regreso}
                          onChange={(e) => handleCantidadRegreso(index, e.target.value)}
                          className="input-cantidad"
                        />
                      </td>
                      <td className="monto-regreso">
                        ${(item.precio_unitario * item.cantidad_regreso).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="resumen-card" style={{ marginTop: "1rem" }}>
              <div className="resumen-row">
                <span>Monto de Regreso:</span>
                <strong className="monto-regreso">${calcularMontoRegreso().toFixed(2)}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRegresando(null)}>
                Cancelar
              </button>
              <button className="btn btn-entregado" onClick={confirmarRegreso}>
                Confirmar Regreso
              </button>
            </div>
          </div>
        </div>
      )}

      {salidas.length === 0 ? (
        <p className="empty">No tienes salidas asignadas</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Camion</th>
                <th>Cliente</th>
                <th>Mercaderia</th>
                <th>Total</th>
                <th>Monto Salida</th>
                <th>Monto Regreso</th>
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
                          Salir
                        </button>
                      )}
                      {s.estado === "en_camino" && (
                        <button
                          className="btn btn-sm btn-entregado"
                          onClick={() => openRegresoForm(s)}
                        >
                          Registrar Regreso
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
  );
}
