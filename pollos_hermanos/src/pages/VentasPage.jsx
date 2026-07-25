import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { productosAPI, ventasAPI, clientesAPI, salidasAPI } from "../api";
import { generarComprobantePDF } from "../utils/generarPDF";

export default function VentasPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [success, setSuccess] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cantidades, setCantidades] = useState({});
  const [form, setForm] = useState({
    tipo_venta: "local",
    clienteId: "",
    medio_pago: "efectivo",
    notas: "",
  });
  const [pagoDividido, setPagoDividido] = useState(false);
  const [pagos, setPagos] = useState([
    { medio_pago: "efectivo", monto: 0 },
  ]);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newClienteNombre, setNewClienteNombre] = useState("");
  const [pagarDeuda, setPagarDeuda] = useState(false);
  const [camionesActivos, setCamionesActivos] = useState([]);
  const [camionSeleccionado, setCamionSeleccionado] = useState("");
  const [stockCamion, setStockCamion] = useState([]);

  useEffect(() => {
    productosAPI.getAll().then((res) => {
      setProductos(res.data);
      const init = {};
      res.data.forEach((p) => { init[p.id] = 0; });
      setCantidades(init);
    }).catch(console.error);
    clientesAPI.getAll().then((res) => setClientes(res.data)).catch(console.error);
    if (form.tipo_venta === "reparto") {
      salidasAPI.getCamionesActivos().then((res) => {
        setCamionesActivos(res.data);
        if (res.data.length > 0 && !camionSeleccionado) {
          const enCamino = res.data.find((c) => c.estado === "en_camino");
          const primero = enCamino || res.data[0];
          setCamionSeleccionado(String(primero.id));
        }
      }).catch(console.error);
    }
  }, [form.tipo_venta]);

  useEffect(() => {
    if (camionSeleccionado && form.tipo_venta === "reparto") {
      salidasAPI.getStockCamion(camionSeleccionado).then((res) => {
        setStockCamion(res.data.items);
        const init = {};
        res.data.items.forEach((item) => { init[item.productoId] = 0; });
        setCantidades(init);
      }).catch(console.error);
    } else {
      setStockCamion([]);
    }
  }, [camionSeleccionado, form.tipo_venta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "tipo_venta") {
      setCamionSeleccionado("");
      setStockCamion([]);
      if (value === "reparto") {
        salidasAPI.getCamionesActivos().then((res) => {
          setCamionesActivos(res.data);
          if (res.data.length > 0) {
            const enCamino = res.data.find((c) => c.estado === "en_camino");
            const primero = enCamino || res.data[0];
            setCamionSeleccionado(String(primero.id));
          }
        }).catch(console.error);
      }
    }
  };

  const toggleCantidad = (productoId, delta) => {
    setCantidades((prev) => {
      const actual = prev[productoId] || 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  };

  const getStockMax = (productoId) => {
    const p = productosBase.find((bp) => bp.id === productoId);
    return p ? p.stock : 0;
  };

  const handlePagoChange = (index, e) => {
    const newPagos = [...pagos];
    newPagos[index][e.target.name] = e.target.value;
    setPagos(newPagos);
  };

  const addPago = () => {
    setPagos([...pagos, { medio_pago: "efectivo", monto: 0 }]);
  };

  const removePago = (index) => {
    if (pagos.length > 1) {
      setPagos(pagos.filter((_, i) => i !== index));
    }
  };

  const esReparto = form.tipo_venta === "reparto";
  const productosBase = esReparto && stockCamion.length > 0
    ? stockCamion.map((sc) => ({
        id: sc.productoId,
        nombre: sc.nombre,
        precio: sc.precio,
        stock: sc.disponible,
        cargado: sc.cargado,
        devuelto: sc.devuelto,
      }))
    : productos;

  const productosFiltrados = productosBase.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const productosSeleccionados = productosBase.filter((p) => (cantidades[p.id] || 0) > 0);

  const calcularSubtotal = () => {
    return productosSeleccionados.reduce((sum, p) => {
      return sum + p.precio * (cantidades[p.id] || 0);
    }, 0);
  };

  const clienteSeleccionado = clientes.find((c) => c.id === parseInt(form.clienteId));
  const subtotal = calcularSubtotal();
  const deudaAnterior = clienteSeleccionado ? parseFloat(clienteSeleccionado.saldo_pendiente) || 0 : 0;
  const tieneDeuda = deudaAnterior > 0;
  const montoDeuda = pagarDeuda && tieneDeuda ? deudaAnterior : 0;
  const totalConDeuda = subtotal + montoDeuda;

  const totalPagosDivididos = pagoDividido
    ? pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
    : 0;

  const sumaPagosValida = !pagoDividido || Math.abs(totalPagosDivididos - totalConDeuda) < 0.01;

  const tieneCCSimple = !pagoDividido && form.medio_pago === "cuenta_corriente";
  const tieneCCDividido = pagoDividido && pagos.some((p) => p.medio_pago === "cuenta_corriente");

  const montoCC = pagoDividido
    ? pagos
        .filter((p) => p.medio_pago === "cuenta_corriente")
        .reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
    : tieneCCSimple
    ? subtotal
    : 0;

  const totalAcumulado = deudaAnterior + montoCC;
  const limiteCredito = clienteSeleccionado ? parseFloat(clienteSeleccionado.limite_credito) || 30000 : 30000;
  const excedeCredito = (tieneCCSimple || tieneCCDividido) && totalAcumulado > limiteCredito;

  const handleClienteChange = (e) => {
    if (e.target.value === "nuevo") {
      setShowNewCliente(true);
      setNewClienteNombre("");
    } else {
      handleChange(e);
      setPagarDeuda(false);
    }
  };

  const handleCreateCliente = async () => {
    if (!newClienteNombre.trim()) return;
    try {
      const res = await clientesAPI.create({ nombre: newClienteNombre.trim() });
      const clientesRes = await clientesAPI.getAll();
      setClientes(clientesRes.data);
      setForm({ ...form, clienteId: res.data.id });
      setShowNewCliente(false);
      setNewClienteNombre("");
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const togglePagoDividido = () => {
    if (pagoDividido) {
      setPagoDividido(false);
      setPagos([{ medio_pago: "efectivo", monto: 0 }]);
    } else {
      setPagoDividido(true);
      setPagos([{ medio_pago: "efectivo", monto: subtotal }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clienteId) {
      alert("Debe seleccionar un cliente registrado");
      return;
    }
    if (productosSeleccionados.length === 0) {
      alert("Debe seleccionar al menos un producto");
      return;
    }
    if (esReparto && !camionSeleccionado) {
      alert("Debe seleccionar un camion para venta por reparto");
      return;
    }
    if (excedeCredito) {
      alert(`El cliente excede su limite de credito. Debe: $${deudaAnterior.toFixed(2)}, monto CC: $${montoCC.toFixed(2)}, limite: $${limiteCredito.toFixed(2)}`);
      return;
    }
    if (pagoDividido && !sumaPagosValida) {
      alert(`La suma de los pagos ($${totalPagosDivididos.toFixed(2)}) no coincide con el total ($${totalConDeuda.toFixed(2)})`);
      return;
    }
    setLoading(true);
    try {
      const data = {
        tipo_venta: form.tipo_venta,
        clienteId: parseInt(form.clienteId),
        medio_pago: form.medio_pago,
        notas: form.notas,
        items: productosSeleccionados.map((p) => ({
          productoId: p.id,
          cantidad: cantidades[p.id],
        })),
      };
      if (esReparto && camionSeleccionado) {
        data.salidaCamionId = parseInt(camionSeleccionado);
      }
      if (pagarDeuda && tieneDeuda) {
        data.pagar_deuda = true;
        data.monto_deuda = deudaAnterior;
      }
      if (pagoDividido) {
        data.pagos = pagos.map((p) => ({
          medio_pago: p.medio_pago,
          monto: parseFloat(p.monto) || 0,
        }));
      }
      const res = await ventasAPI.create(data);
      const ventaGuardada = res.data.venta;
      setUltimaVenta(ventaGuardada);
      setSuccess(true);

      generarComprobantePDF(ventaGuardada);

      setForm({
        tipo_venta: "local",
        clienteId: "",
        medio_pago: "efectivo",
        notas: "",
      });
      setPagoDividido(false);
      setPagos([{ medio_pago: "efectivo", monto: 0 }]);
      setPagarDeuda(false);
      setCamionSeleccionado("");
      setStockCamion([]);
      setBusqueda("");

      const [productosRes, clientesRes] = await Promise.all([
        productosAPI.getAll(),
        clientesAPI.getAll(),
      ]);
      setProductos(productosRes.data);
      setClientes(clientesRes.data);
      const reset = {};
      productosRes.data.forEach((p) => { reset[p.id] = 0; });
      setCantidades(reset);

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Nueva Venta</h2>

      {success && ultimaVenta && (
        <div className="success-msg">
          Venta {ultimaVenta.numero_comprobante} registrada. PDF descargado.
        </div>
      )}

      {showNewCliente && (
        <div className="modal-overlay" onClick={() => setShowNewCliente(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo Cliente</h3>
            <div className="form-group">
              <label>Nombre *</label>
              <input
                value={newClienteNombre}
                onChange={(e) => setNewClienteNombre(e.target.value)}
                placeholder="Nombre del cliente"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewCliente(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateCliente} disabled={!newClienteNombre.trim()}>Crear</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3>Datos de la Venta</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Venta *</label>
              <select name="tipo_venta" value={form.tipo_venta} onChange={handleChange} required>
                <option value="local">Venta de Local</option>
                <option value="reparto">Venta por Reparto</option>
              </select>
            </div>
            {esReparto && (
              <div className="form-group">
                <label>Camion *</label>
                <div className="camiones-grid">
                  {camionesActivos.map((c) => {
                    const activo = c.estado === "en_camino";
                    const estadoLabel = c.estado === "en_camino" ? "En camino" : c.estado === "entregado" ? "Entregado" : "Sobrante";
                    return (
                      <div
                        key={c.id}
                        className={`camion-card ${parseInt(camionSeleccionado) === c.id ? "selected" : ""} ${activo ? "camion-pendiente" : ""}`}
                        onClick={() => setCamionSeleccionado(String(c.id))}
                      >
                        <div className="camion-card-nombre">{c.camion}</div>
                        <div className="camion-card-repartidor">{c.repartidor_asignado?.nombre || "Sin repartidor"}</div>
                        <div className={`camion-card-estado camion-estado-${c.estado}`}>{estadoLabel}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Cliente *</label>
              <select name="clienteId" value={form.clienteId} onChange={handleClienteChange} required>
                <option value="">Seleccionar cliente</option>
                {clientes.filter((c) => c.nombre !== "Seleccionar cliente").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
                <option value="nuevo">+ Nuevo Cliente</option>
              </select>
            </div>
          </div>

          {tieneDeuda && (
            <div className="form-card" style={{ marginTop: "0.5rem", borderLeft: "3px solid #e74c3c" }}>
              <div className="resumen-row">
                <span style={{ fontWeight: "bold", color: "#e74c3c" }}>
                  Deuda pendiente en cuenta corriente:
                </span>
                <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
              </div>
              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={pagarDeuda}
                    onChange={(e) => setPagarDeuda(e.target.checked)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Agregar pago de deuda al total a pagar
                </label>
              </div>
              {pagarDeuda && (
                <div className="resumen-row" style={{ marginTop: "0.25rem" }}>
                  <span>Monto de deuda a pagar:</span>
                  <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={pagoDividido}
                onChange={togglePagoDividido}
                style={{ marginRight: "0.5rem" }}
              />
              Pago dividido (multiples medios de pago)
            </label>
          </div>

          {!pagoDividido && (
            <div className="form-group">
              <label>Medio de Pago *</label>
              <select name="medio_pago" value={form.medio_pago} onChange={handleChange} required>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cuenta_corriente">Cuenta Corriente</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}

          {pagoDividido && (
            <div className="form-card" style={{ marginTop: "0.5rem" }}>
              <h3>Medios de Pago</h3>
              {pagos.map((pago, index) => (
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
                    <option value="cuenta_corriente">Cuenta Corriente</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="number"
                    name="monto"
                    value={pago.monto}
                    onChange={(e) => handlePagoChange(index, e)}
                    min="0"
                    step="0.01"
                    placeholder="Monto"
                    required
                  />
                  {pagos.length > 1 && (
                    <button type="button" className="btn btn-sm btn-cancel" onClick={() => removePago(index)}>X</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addPago}>+ Agregar Medio de Pago</button>
              <div className="resumen-row" style={{ marginTop: "0.5rem" }}>
                <span>Suma de pagos:</span>
                <strong className={sumaPagosValida ? "monto-regreso" : "monto-salida"}>
                  ${totalPagosDivididos.toFixed(2)}
                </strong>
              </div>
              {!sumaPagosValida && (
                <div className="error-msg" style={{ marginTop: "0.25rem" }}>
                  La suma debe ser exactamente ${totalConDeuda.toFixed(2)}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Observaciones</label>
            <input
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Observaciones"
            />
          </div>
        </div>

        <div className="form-card">
          <h3>Productos</h3>

          {esReparto && !camionSeleccionado && (
            <p className="empty" style={{ marginBottom: "1rem" }}>
              Seleccione un camion para ver y seleccionar productos
            </p>
          )}

          <div className="producto-search">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              disabled={esReparto && !camionSeleccionado}
            />
          </div>

          {productosFiltrados.length === 0 ? (
            <p className="empty">{esReparto && !camionSeleccionado ? "Seleccione un camion primero" : "No se encontraron productos"}</p>
          ) : (
            <div className="producto-grid">
              {productosFiltrados.map((p) => {
                const qty = cantidades[p.id] || 0;
                const seleccionado = qty > 0;
                return (
                  <div
                    key={p.id}
                    className={`producto-card ${seleccionado ? "selected" : ""}`}
                  >
                    <div className="producto-card-name">{p.nombre}</div>
                    <div className="producto-card-price">${p.precio}</div>
                    <div className={`producto-card-stock ${p.stock <= (p.stock_minimo || 10) ? "bajo" : ""}`}>
                      Stock: {p.stock}
                      {esReparto && p.devuelto > 0 && (
                        <span style={{ color: "#e74c3c", fontSize: "0.75rem", marginLeft: "0.25rem" }}>
                          (devuelto: {p.devuelto})
                        </span>
                      )}
                    </div>
                    <div className="producto-card-qty">
                      <button
                        type="button"
                        onClick={() => toggleCantidad(p.id, -1)}
                        disabled={qty === 0 || (esReparto && !camionSeleccionado)}
                      >
                        -
                      </button>
                      <span>{qty}</span>
                      <button
                        type="button"
                        onClick={() => toggleCantidad(p.id, 1)}
                        disabled={qty >= getStockMax(p.id) || (esReparto && !camionSeleccionado)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-card resumen-card">
          {productosSeleccionados.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              {productosSeleccionados.map((p) => (
                <div key={p.id} className="resumen-row">
                  <span>{cantidades[p.id]}x {p.nombre}</span>
                  <strong>${(p.precio * cantidades[p.id]).toFixed(2)}</strong>
                </div>
              ))}
              <div className="cierre-separator"></div>
            </div>
          )}

          {tieneDeuda && !pagarDeuda && (
            <div className="resumen-row" style={{ opacity: 0.6 }}>
              <span>Deuda pendiente:</span>
              <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
            </div>
          )}

          {pagarDeuda && tieneDeuda && (
            <>
              <div className="resumen-row">
                <span>Subtotal productos:</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div className="resumen-row">
                <span>Pago de deuda:</span>
                <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
              </div>
              <div className="cierre-separator"></div>
            </>
          )}

          {(tieneCCSimple || tieneCCDividido) && clienteSeleccionado && deudaAnterior > 0 && (
            <>
              <div className="resumen-row">
                <span>Deuda anterior:</span>
                <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
              </div>
              <div className="resumen-row">
                <span>Monto CC esta venta:</span>
                <strong>${montoCC.toFixed(2)}</strong>
              </div>
              <div className="cierre-separator"></div>
            </>
          )}
          <div className="resumen-row">
            <span>Subtotal:</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          {pagarDeuda && tieneDeuda && (
            <div className="resumen-row">
              <span>+ Deuda a pagar:</span>
              <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
            </div>
          )}
          {(tieneCCSimple || tieneCCDividido) && (
            <div className="resumen-row resumen-total">
              <span>Total a deber:</span>
              <strong className="monto-salida">${totalAcumulado.toFixed(2)}</strong>
            </div>
          )}
          {!(tieneCCSimple || tieneCCDividido) && (
            <div className="resumen-row resumen-total">
              <span>Total:</span>
              <strong className="monto-ventas">${totalConDeuda.toFixed(2)}</strong>
            </div>
          )}
          {(tieneCCSimple || tieneCCDividido) && (
            <div className="resumen-row">
              <span>Credito disponible:</span>
              <strong className={excedeCredito ? "monto-salida" : "monto-regreso"}>
                ${(limiteCredito - totalAcumulado).toFixed(2)}
              </strong>
            </div>
          )}
          {excedeCredito && (
            <div className="error-msg" style={{ marginTop: "0.5rem" }}>
              El cliente excede su limite de credito. Debe reducir la deuda o que un administrador autorice.
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading || excedeCredito || (pagoDividido && !sumaPagosValida) || productosSeleccionados.length === 0}
        >
          {loading ? "Procesando..." : "Finalizar Venta"}
        </button>
      </form>
    </div>
  );
}
