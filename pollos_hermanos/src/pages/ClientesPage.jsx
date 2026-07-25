import { useState, useEffect } from "react";
import { clientesAPI } from "../api";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [nombre, setNombre] = useState("");
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [clientePago, setClientePago] = useState(null);
  const [pagosCC, setPagosCC] = useState([{ medio_pago: "efectivo", monto: 0 }]);

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

  const openPagoCC = (c) => {
    setClientePago(c);
    setPagosCC([{ medio_pago: "efectivo", monto: 0 }]);
    setShowPagoForm(true);
  };

  const handlePagoChange = (index, e) => {
    const newPagos = [...pagosCC];
    newPagos[index][e.target.name] = e.target.value;
    setPagosCC(newPagos);
  };

  const addPagoCC = () => {
    setPagosCC([...pagosCC, { medio_pago: "efectivo", monto: 0 }]);
  };

  const removePagoCC = (index) => {
    if (pagosCC.length > 1) {
      setPagosCC(pagosCC.filter((_, i) => i !== index));
    }
  };

  const totalPagosCC = pagosCC.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const deudaActual = clientePago ? parseFloat(clientePago.saldo_pendiente) || 0 : 0;
  const pagoValido = totalPagosCC > 0 && totalPagosCC <= deudaActual;

  const submitPagoCC = async (e) => {
    e.preventDefault();
    if (!pagoValido) {
      alert("El monto del pago no es valido");
      return;
    }
    try {
      const res = await clientesAPI.registrarPagoCC(clientePago.id, {
        pagos: pagosCC.map((p) => ({
          medio_pago: p.medio_pago,
          monto: parseFloat(p.monto) || 0,
        })),
      });
      alert(res.data.message);
      setShowPagoForm(false);
      setClientePago(null);
      loadClientes();
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
            <h3>Historial de {historial.cliente.nombre}</h3>
            <div className="cc-resumen">
              <div className="cc-item"><span>Saldo pendiente:</span><strong className="monto-salida">${historial.saldo_pendiente.toFixed(2)}</strong></div>
              <div className="cc-item"><span>Limite de credito:</span><strong>${historial.limite_credito.toFixed(2)}</strong></div>
              <div className="cc-item"><span>Credito disponible:</span><strong className="monto-regreso">${historial.credito_disponible.toFixed(2)}</strong></div>
            </div>

            {historial.pagos && historial.pagos.length > 0 && (
              <>
                <h4>Pagos de Cuenta Corriente</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Medio de Pago</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.pagos.map((p) => (
                        <tr key={p.id}>
                          <td>{p.fecha}</td>
                          <td>{p.hora}</td>
                          <td>{p.medio_pago}</td>
                          <td className="monto-regreso">-${parseFloat(p.monto).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h4>Todas las Compras</h4>
            {historial.ventas.length === 0 ? (
              <p className="empty">No hay compras registradas</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nro Comprobante</th>
                      <th>Medio de Pago</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.ventas.map((v) => (
                      <tr key={v.id}>
                        <td>{v.fecha} {v.hora}</td>
                        <td><strong>{v.numero_comprobante}</strong></td>
                        <td>{v.pago_dividido ? "Dividido" : v.medio_pago}</td>
                        <td>${v.total}</td>
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

      {showPagoForm && clientePago && (
        <div className="modal-overlay" onClick={() => setShowPagoForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Registrar Pago - {clientePago.nombre}</h3>
            <div className="cc-resumen" style={{ marginBottom: "1rem" }}>
              <div className="cc-item">
                <span>Deuda actual:</span>
                <strong className="monto-salida">${deudaActual.toFixed(2)}</strong>
              </div>
            </div>
            <form onSubmit={submitPagoCC}>
              {pagosCC.map((pago, index) => (
                <div key={index} className="item-row">
                  <select
                    name="medio_pago"
                    value={pago.medio_pago}
                    onChange={(e) => handlePagoChange(index, e)}
                    required
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="number"
                    name="monto"
                    value={pago.monto}
                    onChange={(e) => handlePagoChange(index, e)}
                    min="0"
                    step="0.01"
                    max={deudaActual}
                    placeholder="Monto"
                    required
                  />
                  {pagosCC.length > 1 && (
                    <button type="button" className="btn btn-sm btn-cancel" onClick={() => removePagoCC(index)}>X</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addPagoCC} style={{ marginBottom: "0.5rem" }}>
                + Agregar Medio de Pago
              </button>
              <div className="resumen-row">
                <span>Total a pagar:</span>
                <strong className={pagoValido ? "monto-regreso" : "monto-salida"}>
                  ${totalPagosCC.toFixed(2)}
                </strong>
              </div>
              <div className="resumen-row">
                <span>Saldo restante:</span>
                <strong>${(deudaActual - totalPagosCC).toFixed(2)}</strong>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPagoForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={!pagoValido}>
                  Registrar Pago
                </button>
              </div>
            </form>
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
                        {saldo > 0 && (
                          <button className="btn btn-sm btn-primary" onClick={() => openPagoCC(c)}>Registrar Pago</button>
                        )}
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
