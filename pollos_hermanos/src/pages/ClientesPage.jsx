import { useState, useEffect } from "react";
import { clientesAPI } from "../api";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const res = await clientesAPI.getAll();
      setClientes(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await clientesAPI.update(editando.id, { nombre });
      } else {
        await clientesAPI.create({ nombre });
      }
      setShowForm(false);
      setEditando(null);
      setNombre("");
      loadClientes();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const openEdit = (c) => {
    setEditando(c);
    setNombre(c.nombre);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditando(null);
    setNombre("");
    setShowForm(true);
  };

  const verHistorial = async (c) => {
    try {
      const res = await clientesAPI.getHistorialCC(c.id);
      setHistorial(res.data);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Desactivar este cliente?")) return;
    try {
      await clientesAPI.delete(id);
      loadClientes();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Clientes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Cliente</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar Cliente" : "Nuevo Cliente"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del cliente *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historial && (
        <div className="modal-overlay" onClick={() => setHistorial(null)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Historial Cuenta Corriente - {historial.cliente.nombre}</h3>
            <div className="cc-resumen">
              <div className="cc-item"><span>Saldo pendiente:</span><strong className="monto-salida">${historial.saldo_pendiente.toFixed(2)}</strong></div>
              <div className="cc-item"><span>Limite de credito:</span><strong>${historial.limite_credito.toFixed(2)}</strong></div>
              <div className="cc-item"><span>Credito disponible:</span><strong className="monto-regreso">${historial.credito_disponible.toFixed(2)}</strong></div>
            </div>
            {historial.ventas.length === 0 ? (
              <p className="empty">No hay compras en cuenta corriente</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nro Comprobante</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.ventas.map((v) => (
                      <tr key={v.id}>
                        <td>{v.fecha} {v.hora}</td>
                        <td><strong>{v.numero_comprobante}</strong></td>
                        <td className="monto-salida">${v.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setHistorial(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {clientes.length === 0 ? (
        <p className="empty">No hay clientes registrados</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Saldo Pendiente</th>
                <th>Limite Credito</th>
                <th>Credito Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const saldo = parseFloat(c.saldo_pendiente) || 0;
                const limite = parseFloat(c.limite_credito) || 30000;
                const disponible = limite - saldo;
                return (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td className={saldo > 0 ? "monto-salida" : ""}>
                      {saldo > 0 ? <strong>${saldo.toFixed(2)}</strong> : "$0.00"}
                    </td>
                    <td>${limite.toFixed(2)}</td>
                    <td className="monto-regreso">${disponible.toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-primary" onClick={() => openEdit(c)}>Editar</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => verHistorial(c)}>Historial</button>
                        <button className="btn btn-sm btn-cancel" onClick={() => handleDelete(c.id)}>Desactivar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
