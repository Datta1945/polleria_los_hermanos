import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { productosAPI, ventasAPI, clientesAPI } from "../api";
import { generarComprobantePDF } from "../utils/generarPDF";

export default function VentasPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [success, setSuccess] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({
    tipo_venta: "local",
    cliente_nombre: "",
    medio_pago: "efectivo",
    clienteId: "",
    notas: "",
    items: [{ productoId: "", cantidad: 1 }],
  });

  useEffect(() => {
    productosAPI.getAll().then((res) => setProductos(res.data)).catch(console.error);
    clientesAPI.getAll().then((res) => setClientes(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...form.items];
    newItems[index][e.target.name] = e.target.value;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productoId: "", cantidad: 1 }] });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    }
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const calcularSubtotal = () => {
    return form.items.reduce((sum, item) => {
      const producto = productos.find((p) => p.id === parseInt(item.productoId));
      if (producto) {
        return sum + producto.precio * (parseInt(item.cantidad) || 0);
      }
      return sum;
    }, 0);
  };

  const clienteSeleccionado = clientes.find((c) => c.id === parseInt(form.clienteId));
  const esCuentaCorriente = form.medio_pago === "cuenta_corriente";
  const subtotal = calcularSubtotal();
  const deudaAnterior = esCuentaCorriente && clienteSeleccionado ? parseFloat(clienteSeleccionado.saldo_pendiente) || 0 : 0;
  const totalAcumulado = deudaAnterior + subtotal;
  const limiteCredito = esCuentaCorriente && clienteSeleccionado ? parseFloat(clienteSeleccionado.limite_credito) || 30000 : 30000;
  const excedeCredito = esCuentaCorriente && totalAcumulado > limiteCredito;

  const clienteNombreAutomatico = esCuentaCorriente && clienteSeleccionado ? clienteSeleccionado.nombre : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (excedeCredito) {
      alert(`El cliente excede su limite de credito. Debe: $${deudaAnterior.toFixed(2)}, compra: $${subtotal.toFixed(2)}, limite: $${limiteCredito.toFixed(2)}`);
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        cliente_nombre: esCuentaCorriente ? clienteNombreAutomatico : form.cliente_nombre,
        items: form.items
          .filter((item) => item.productoId)
          .map((item) => ({
            productoId: parseInt(item.productoId),
            cantidad: parseInt(item.cantidad) || 1,
          })),
      };
      const res = await ventasAPI.create(data);
      const ventaGuardada = res.data.venta;
      setUltimaVenta(ventaGuardada);
      setSuccess(true);

      generarComprobantePDF(ventaGuardada);

      setForm({
        tipo_venta: "local",
        cliente_nombre: "",
        medio_pago: "efectivo",
        clienteId: "",
        notas: "",
        items: [{ productoId: "", cantidad: 1 }],
      });
      setBusqueda("");

      const [productosRes, clientesRes] = await Promise.all([
        productosAPI.getAll(),
        clientesAPI.getAll(),
      ]);
      setProductos(productosRes.data);
      setClientes(clientesRes.data);

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
          </div>

          {esCuentaCorriente ? (
            <div className="form-group">
              <label>Cliente (Cuenta Corriente) *</label>
              <select name="clienteId" value={form.clienteId} onChange={handleChange} required>
                <option value="">Seleccionar cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} - Deuda: ${parseFloat(c.saldo_pendiente).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Nombre del Cliente *</label>
              <input
                name="cliente_nombre"
                value={form.cliente_nombre}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                required
              />
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
          <div className="form-group">
            <label>Buscar producto</label>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escriba para filtrar..."
            />
          </div>

          {form.items.map((item, index) => (
            <div key={index} className="item-row">
              <select
                name="productoId"
                value={item.productoId}
                onChange={(e) => handleItemChange(index, e)}
                required
              >
                <option value="">Seleccionar producto</option>
                {productosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} - ${p.precio} (Stock: {p.stock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="cantidad"
                value={item.cantidad}
                onChange={(e) => handleItemChange(index, e)}
                min="1"
                placeholder="Cant."
                required
              />
              {form.items.length > 1 && (
                <button type="button" className="btn btn-sm btn-cancel" onClick={() => removeItem(index)}>X</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Agregar Producto</button>
        </div>

        <div className="form-card resumen-card">
          {esCuentaCorriente && deudaAnterior > 0 && (
            <>
              <div className="resumen-row">
                <span>Deuda anterior:</span>
                <strong className="monto-salida">${deudaAnterior.toFixed(2)}</strong>
              </div>
              <div className="resumen-row">
                <span>Compra actual:</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div className="cierre-separator"></div>
            </>
          )}
          <div className="resumen-row">
            <span>Subtotal:</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          {esCuentaCorriente && (
            <div className="resumen-row resumen-total">
              <span>Total a deber:</span>
              <strong className="monto-salida">${totalAcumulado.toFixed(2)}</strong>
            </div>
          )}
          {!esCuentaCorriente && (
            <div className="resumen-row resumen-total">
              <span>Total:</span>
              <strong className="monto-ventas">${subtotal.toFixed(2)}</strong>
            </div>
          )}
          {esCuentaCorriente && (
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

        <button type="submit" className="btn btn-primary btn-full" disabled={loading || excedeCredito}>
          {loading ? "Procesando..." : "Finalizar Venta"}
        </button>
      </form>
    </div>
  );
}
