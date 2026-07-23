import { useState, useEffect } from "react";
import { usuariosAPI } from "../api";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [resetPass, setResetPass] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    roleId: "",
    activo: true,
  });
  const [nuevaPass, setNuevaPass] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usuariosAPI.getAll(),
        usuariosAPI.getRoles(),
      ]);
      setUsuarios(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditando(null);
    setForm({ nombre: "", email: "", password: "", roleId: "", activo: true });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      roleId: u.Role?.id || "",
      activo: u.activo,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        const data = {
          nombre: form.nombre,
          email: form.email,
          roleId: parseInt(form.roleId),
          activo: form.activo,
        };
        await usuariosAPI.update(editando.id, data);
      } else {
        await usuariosAPI.create(form);
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleResetPassword = async () => {
    if (!resetPass) return;
    try {
      await usuariosAPI.resetPassword(resetPass.id, { password: nuevaPass });
      setResetPass(null);
      setNuevaPass("");
      alert("Contraseña restablecida!");
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleActivo = async (u) => {
    try {
      await usuariosAPI.update(u.id, { activo: !u.activo });
      loadData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await usuariosAPI.delete(id);
      loadData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Gestion de Usuarios</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Usuario</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar Usuario" : "Nuevo Usuario"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              {!editando && (
                <div className="form-group">
                  <label>Contrasena *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength="6"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Rol *</label>
                <select
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    style={{ width: "auto", marginRight: "8px" }}
                  />
                  Activo
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPass && (
        <div className="modal-overlay" onClick={() => setResetPass(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Restablecer Contrasena</h3>
            <p className="subtitle">Usuario: {resetPass.nombre}</p>
            <div className="form-group">
              <label>Nueva Contrasena (min 6 caracteres)</label>
              <input
                type="password"
                value={nuevaPass}
                onChange={(e) => setNuevaPass(e.target.value)}
                minLength="6"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setResetPass(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={nuevaPass.length < 6}>
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nombre}</strong></td>
                <td>{u.email}</td>
                <td><span className="badge">{u.Role?.nombre || "-"}</span></td>
                <td>
                  <span className={`estado-badge ${u.activo ? "" : "badge-cancelado"}`}
                    style={{ backgroundColor: u.activo ? "#10b981" : "#ef4444" }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-primary" onClick={() => openEdit(u)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setResetPass(u)}>
                      Pass
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: u.activo ? "#f59e0b" : "#10b981", color: "white" }}
                      onClick={() => handleToggleActivo(u)}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn btn-sm btn-cancel" onClick={() => handleDelete(u.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
