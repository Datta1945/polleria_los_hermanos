import { useState, useEffect } from "react";
import { cierreCajaAPI } from "../api";

export default function HistorialCierres() {
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCierres();
  }, []);

  const loadCierres = async () => {
    try {
      const res = await cierreCajaAPI.getHistorial();
      setCierres(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <h2>Historial de Cierres de Caja</h2>

      {cierres.length === 0 ? (
        <p className="empty">No hay cierres de caja registrados</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Salidas</th>
                <th>Mercaderia Enviada</th>
                <th>Mercaderia Devuelta</th>
                <th>Ventas Netas</th>
                <th>Total Ventas</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {cierres.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.fecha}</strong></td>
                  <td>{c.hora}</td>
                  <td>{c.salidas_count}</td>
                  <td className="monto-salida">${c.mercaderia_enviada}</td>
                  <td className="monto-regreso">${c.mercaderia_devuelta}</td>
                  <td className="monto-ventas"><strong>${c.ventas_netas}</strong></td>
                  <td><strong>${c.total_ventas}</strong></td>
                  <td>{c.usuario_cierre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
