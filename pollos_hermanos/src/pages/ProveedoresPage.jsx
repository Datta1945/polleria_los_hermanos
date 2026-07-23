import { useState, useEffect } from "react";
import { proveedoresAPI } from "../api";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    email: "",
    tipo_producto: "",
  });

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      const res = await proveedoresAPI.getAll();
      setProveedores(res.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await proveedoresAPI.update(editing.id, form);
      } else {
        await proveedoresAPI.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ nombre: "", telefono: "", direccion: "", email: "", tipo_producto: "" });
      loadProveedores();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (proveedor) => {
    setEditing(proveedor);
    setForm({
      nombre: proveedor.nombre,
      telefono: proveedor.telefono || "",
      direccion: proveedor.direccion || "",
      email: proveedor.email || "",
      tipo_producto: proveedor.tipo_producto || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      await proveedoresAPI.delete(id);
      loadProveedores();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Proveedores</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setForm({ nombre: "", telefono: "", direccion: "", email: "", tipo_producto: "" });
          }}
        >
          {showForm ? "Cancelar" : "+ Nuevo Proveedor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h3>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tipo de Producto</label>
              <input
                value={form.tipo_producto}
                onChange={(e) => setForm({ ...form, tipo_producto: e.target.value })}
                placeholder="Ej: pollos, bebidas"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            {editing ? "Actualizar" : "Crear"}
          </button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Tipo Producto</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.telefono || "-"}</td>
                <td>{p.direccion || "-"}</td>
                <td>{p.email || "-"}</td>
                <td>{p.tipo_producto || "-"}</td>
                <td>{p.Productos?.length || 0}</td>
                <td>
                  <button className="btn btn-sm btn-camino" onClick={() => handleEdit(p)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-cancel" onClick={() => handleDelete(p.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
