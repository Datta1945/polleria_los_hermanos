import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { salidasAPI, productosAPI } from "../api";

export default function NuevaSalida() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    camion: "",
    destino: "",
    cliente_nombre: "",
    cliente_direccion: "",
    cliente_telefono: "",
    notas: "",
    items: [{ productoId: "", cantidad: 1 }],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productosAPI.getAll().then((res) => setProductos(res.data)).catch(console.error);
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
    setForm({
      ...form,
      items: [...form.items, { productoId: "", cantidad: 1 }],
    });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    }
  };

  const calcularTotal = () => {
    return form.items.reduce((sum, item) => {
      const producto = productos.find((p) => p.id === parseInt(item.productoId));
      if (producto) {
        return sum + producto.precio * (parseInt(item.cantidad) || 0);
      }
      return sum;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        asignadoRepartidorId: user.id,
        items: form.items
          .filter((item) => item.productoId)
          .map((item) => ({
            productoId: parseInt(item.productoId),
            cantidad: parseInt(item.cantidad) || 1,
          })),
      };
      await salidasAPI.create(data);
      setSuccess(true);
      setForm({
        camion: "",
        destino: "",
        cliente_nombre: "",
        cliente_direccion: "",
        cliente_telefono: "",
        notas: "",
        items: [{ productoId: "", cantidad: 1 }],
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalCalculado = calcularTotal();

  return (
    <div>
      <h2>Registro de Salidas</h2>

      {success && <div className="success-msg">Salida registrada exitosamente!</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label>Camion (Placa/Numero) *</label>
            <input
              name="camion"
              value={form.camion}
              onChange={handleChange}
              placeholder="Ej: ABC-123"
              required
            />
          </div>
          <div className="form-group">
            <label>Destino</label>
            <input
              name="destino"
              value={form.destino}
              onChange={handleChange}
              placeholder="Zona o direccion de destino"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cliente *</label>
            <input
              name="cliente_nombre"
              value={form.cliente_nombre}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div className="form-group">
            <label>Telefono</label>
            <input
              name="cliente_telefono"
              value={form.cliente_telefono}
              onChange={handleChange}
              placeholder="Telefono"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Direccion del Cliente</label>
          <input
            name="cliente_direccion"
            value={form.cliente_direccion}
            onChange={handleChange}
            placeholder="Direccion de entrega"
          />
        </div>

        <div className="form-group">
          <label>Notas</label>
          <input
            name="notas"
            value={form.notas}
            onChange={handleChange}
            placeholder="Observaciones"
          />
        </div>

        <div className="section">
          <h3>Mercaderia del Camion</h3>
          {form.items.map((item, index) => (
            <div key={index} className="item-row">
              <select
                name="productoId"
                value={item.productoId}
                onChange={(e) => handleItemChange(index, e)}
                required
              >
                <option value="">Seleccionar producto</option>
                {productos.map((p) => (
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
                <button
                  type="button"
                  className="btn btn-sm btn-cancel"
                  onClick={() => removeItem(index)}
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>
            + Agregar Producto
          </button>
        </div>

        <div className="form-card resumen-card">
          <div className="resumen-row">
            <span>Monto de Salida:</span>
            <strong className="monto-salida">${totalCalculado.toFixed(2)}</strong>
          </div>
          <div className="resumen-row">
            <span>Total:</span>
            <strong>${totalCalculado.toFixed(2)}</strong>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrar Salida"}
        </button>
      </form>
    </div>
  );
}
