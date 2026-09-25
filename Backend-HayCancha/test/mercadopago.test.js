import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verificarFirmaMP, estadoDesdeMP, planDesdeMotivo } from '../lib/mercadopago.js';

const secret = 'clave-de-prueba';
const firmar = ({ dataId, requestId, ts }) => {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex');
};

test('acepta una firma válida', () => {
  const v1 = firmar({ dataId: 'ABC123', requestId: 'req-1', ts: '1700000000' });
  assert.equal(verificarFirmaMP({ secret, xSignature: `ts=1700000000,v1=${v1}`, xRequestId: 'req-1', dataId: 'ABC123' }), true);
});

test('el data.id se normaliza a minúsculas', () => {
  const v1 = firmar({ dataId: 'abc123', requestId: 'req-1', ts: '1' });
  assert.equal(verificarFirmaMP({ secret, xSignature: `ts=1,v1=${v1}`, xRequestId: 'req-1', dataId: 'ABC123' }), true);
});

test('rechaza si cambia el id, el request-id, el ts o la clave', () => {
  const v1 = firmar({ dataId: 'abc', requestId: 'req-1', ts: '1' });
  const base = { secret, xSignature: `ts=1,v1=${v1}`, xRequestId: 'req-1', dataId: 'abc' };
  assert.equal(verificarFirmaMP(base), true);
  assert.equal(verificarFirmaMP({ ...base, dataId: 'otro' }), false);
  assert.equal(verificarFirmaMP({ ...base, xRequestId: 'req-2' }), false);
  assert.equal(verificarFirmaMP({ ...base, xSignature: `ts=2,v1=${v1}` }), false);
  assert.equal(verificarFirmaMP({ ...base, secret: 'otra' }), false);
});

test('rechaza entradas vacías o mal formadas', () => {
  assert.equal(verificarFirmaMP({ secret, xSignature: undefined, xRequestId: 'r', dataId: 'a' }), false);
  assert.equal(verificarFirmaMP({ secret, xSignature: 'basura', xRequestId: 'r', dataId: 'a' }), false);
  assert.equal(verificarFirmaMP({ secret: '', xSignature: 'ts=1,v1=aa', xRequestId: 'r', dataId: 'a' }), false);
  assert.equal(verificarFirmaMP({ secret, xSignature: 'ts=1,v1=corta', xRequestId: 'r', dataId: 'a' }), false);
});

test('mapea los estados de Mercado Pago', () => {
  assert.equal(estadoDesdeMP('authorized'), 'activa');
  assert.equal(estadoDesdeMP('paused'), 'pausada');
  assert.equal(estadoDesdeMP('cancelled'), 'cancelada');
  assert.equal(estadoDesdeMP('pending'), 'pendiente');
  assert.equal(estadoDesdeMP(undefined), 'pendiente');
});

test('reconoce solo suscripciones de GridPlay', () => {
  assert.equal(planDesdeMotivo('GridPlay - Plan Full'), 'Full');
  assert.equal(planDesdeMotivo('Netflix'), null);
  assert.equal(planDesdeMotivo(undefined), null);
});

import { buscarPlanCompatible } from '../lib/mercadopago.js';

test('buscarPlanCompatible reutiliza solo planes activos con mismo motivo, precio y back_url', () => {
  const base = { reason: 'GridPlay - Plan Full', precio: 50000, backUrl: 'https://x.com/registro-club' };
  const plan = (o = {}) => ({
    status: 'active', reason: base.reason, back_url: base.backUrl, init_point: 'https://mp.com/p/1',
    auto_recurring: { transaction_amount: 50000 }, ...o,
  });
  assert.equal(buscarPlanCompatible([plan()], base)?.init_point, 'https://mp.com/p/1');
  assert.equal(buscarPlanCompatible([plan({ status: 'inactive' })], base), null);
  assert.equal(buscarPlanCompatible([plan({ auto_recurring: { transaction_amount: 100 } })], base), null);
  assert.equal(buscarPlanCompatible([plan({ back_url: 'https://otro.com' })], base), null);
  assert.equal(buscarPlanCompatible([plan({ init_point: 'javascript:1' })], base), null);
  assert.equal(buscarPlanCompatible(undefined, base), null);
});
