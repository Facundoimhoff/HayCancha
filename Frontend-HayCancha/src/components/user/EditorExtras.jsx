import { Minus, Plus, Package } from 'lucide-react';
import { moneda } from '../../utils/reservas';
import './componentes.css';

const MAXIMO_POR_PRODUCTO = 20;

/**
 * Lista de productos del club (bebidas, alquileres…) con selector de cantidad.
 * `cantidades` es { [idProducto]: cantidad }; `onCambio(id, nuevaCantidad)` avisa cada cambio.
 * Solo se usa para elegir: el precio final lo calcula el servidor.
 */
export default function EditorExtras({ productos, cantidades, onCambio }) {
  if (!productos?.length) {
    return <p className="gp-extras-vacio">Este club todavía no cargó productos para agregar.</p>;
  }

  return (
    <ul className="gp-extras">
      {productos.map((p) => {
        const cantidad = cantidades[p.id] || 0;
        return (
          <li key={p.id} className={`gp-extra ${cantidad > 0 ? 'elegido' : ''}`}>
            <span className="gp-extra-icono" aria-hidden="true">{p.icono || <Package size={18} />}</span>
            <div className="gp-extra-info">
              <span className="gp-extra-nombre">{p.nombre}</span>
              <span className="gp-extra-precio">{moneda(p.precio)}</span>
            </div>
            <div className="gp-stepper" role="group" aria-label={`Cantidad de ${p.nombre}`}>
              <button type="button" onClick={() => onCambio(p.id, Math.max(0, cantidad - 1))} disabled={cantidad === 0} aria-label={`Quitar ${p.nombre}`}>
                <Minus size={16} />
              </button>
              <output aria-live="polite">{cantidad}</output>
              <button type="button" onClick={() => onCambio(p.id, Math.min(MAXIMO_POR_PRODUCTO, cantidad + 1))} disabled={cantidad >= MAXIMO_POR_PRODUCTO} aria-label={`Agregar ${p.nombre}`}>
                <Plus size={16} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
