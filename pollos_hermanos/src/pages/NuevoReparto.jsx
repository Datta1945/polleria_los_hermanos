import { useState, useEffect } from "react";
import { repartosAPI, productosAPI } from "../api";

export default function NuevoReparto() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_direccion: "",
    cliente_telefono: "",
    repartidor: "",
    notas: "",
    items: [{ productoId: "", cantidad: 1 }],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const newItems = form.items.filter((_, i) => i !== index);
      setForm({ ...form, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        items: form.items.filter((item) => item.productoId),
      };
      await repartosAPI.create(data);
      setSuccess(true);
      setForm({
        cliente_nombre: "",
        cliente_direccion: "",
        cliente_telefono: "",
        repartidor: "",
        notas: "",
        items: [{ productoId: "", cantidad: 1 }],
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Error al crear reparto: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Nuevo Reparto</h2>

      {success && <div className="success-msg">Reparto creado exitosamente!</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
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
          <div className="form-group">
            <label>Teléfono</label>
            <input
              name="cliente_telefono"
              value={form.cliente_telefono}
              onChange={handleChange}
              placeholder="Teléfono"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input
            name="cliente_direccion"
            value={form.cliente_direccion}
            onChange={handleChange}
            placeholder="Dirección de entrega"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Repartidor</label>
            <input
              name="repartidor"
              value={form.repartidor}
              onChange={handleChange}
              placeholder="Nombre del repartidor"
            />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <input
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Notas adicionales"
            />
          </div>
        </div>

        <div className="section">
          <h3>Productos</h3>
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

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear Reparto"}
        </button>
      </form>
    </div>
  );
}
