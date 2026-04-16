# HANDOFF - FRONTEND + BACKEND CONTEXTO COMPLETO

## 1) Objetivo general
Se reconstruyeron los módulos de **reportería financiera** para que dejen de depender de mocks y queden listos para conectarse a backend real:

- `/pages/reports` -> Reporte de Caja y Contabilidad (ejecutivo + detalle)
- `/pages/cash-module` -> Dashboard financiero operativo de caja

También se hicieron cambios funcionales previos en POS y clientes.

---

## 2) Cambios funcionales relevantes ya implementados en frontend

### A. Reporte de Caja y Contabilidad (`/pages/reports`)
Reemplazado completamente con:

- Filtros reales: `startDate`, `endDate`, `userId`, `estadoId`
- KPIs financieros:
  - ventas brutas
  - descuentos
  - IVA ventas
  - ventas netas
  - compras totales
  - IVA compras
  - utilidad bruta
  - cartera total y vencida
  - recaudo cartera
- Bloques de visualización:
  - flujo de caja
  - tabla ventas
  - tabla compras
  - tabla financiación
- Exportables: `xlsx`, `pdf`, `csv`
- Loader, empty states, manejo de errores con toast.

### B. Cash Module Dashboard (`/pages/cash-module`)
Reemplazado completamente con:

- Filtros reales por fecha y vendedor
- KPIs de caja:
  - ingresos, egresos, neto
  - efectivo, tarjetas, transferencias, financiado
  - transacciones, ticket promedio
- Mix de medios de pago (valor + porcentaje)
- Tabla de movimientos recientes de caja
- Exportables (`xlsx`, `pdf`, `csv`)
- Loader, empty states, toast.

### C. Cliente mayorista
Se agregó campo booleano nuevo en cliente:

- Campo: `isWholesale`
- Ya está en modelos, formularios y payload de creación/edición.

### D. Recalculo de IVA en POS
El POS ahora asume que el `price` del producto viene **con IVA incluido** y recalcula:

- base sin IVA = `totalConIva / (1 + iva%)`
- valor IVA = `totalConIva - baseSinIva`

---

## 3) Archivos tocados (estado actual)

### Nuevos
- `src/app/components/services/reports.service.ts`
- `HANDOFF_CONTEXT_FRONT_BACK.md`

### Modificados
- `src/app/components/pages/api/reports.ts`
- `src/app/components/pages/reports/reports.component.ts`
- `src/app/components/pages/reports/reports.component.html`
- `src/app/components/pages/reports/reports.component.scss`
- `src/app/components/pages/cash/cash.component.ts`
- `src/app/components/pages/cash/cash.component.html`
- `src/app/components/pages/cash/cash.component.scss`
- `src/app/components/pages/api/shared.ts` (agregado `isWholesale`)
- `src/app/components/shared/customer-form-modal/customer-form-modal.ts`
- `src/app/components/shared/customer-form-modal/customer-form-modal.component.html`
- `src/app/components/pages/master/customers/customers.component.ts`
- `src/app/components/pages/master/customers/customers.component.html`
- `src/app/components/pages/pos-folder/pos/pos.component.ts`
- `src/app/components/pages/pos-folder/payment-dialog/payment-dialog.component.ts`

---

## 4) Contratos frontend (DTOs) ya definidos

En `src/app/components/pages/api/reports.ts`:

- `ReportFilters`
- `FinancialSummary`
- `CashFlowPoint`
- `SalesReportRow`
- `PurchaseReportRow`
- `FinancingReportRow`
- `PagedResponse<T>`
- `CashDashboardSummary`
- `PaymentMixItem`
- `CashMovementRow`
- `ExportSection`
- `ExportFormat`

---

## 5) Endpoints que el frontend YA consume (deben existir en backend)

Base URL actual frontend: `https://localhost:7197/api/`

### Reportes (`/pages/reports`)
1. `GET /api/Reports/GetFinancialSummary`
2. `GET /api/Reports/GetCashFlow`
3. `GET /api/Reports/GetSales`
4. `GET /api/Reports/GetPurchases`
5. `GET /api/Reports/GetFinancing`
6. `GET /api/Reports/Export`

### Cash Module (`/pages/cash-module`)
7. `GET /api/Reports/GetCashDashboardSummary`
8. `GET /api/Reports/GetPaymentMix`
9. `GET /api/Reports/GetRecentCashMovements`

### Query params comunes
- `companiaId` (required)
- `startDate` (required, `yyyy-MM-dd`)
- `endDate` (required, `yyyy-MM-dd`)
- `userId` (optional)
- `estadoId` (optional)

### Export
En `Export` además:
- `section`: `full | summary | cashflow | sales | purchases | financing`
- `format`: `xlsx | pdf | csv`

---

## 6) Prompt completo para backend (copiar y pegar)

```text
Necesito implementar backend para dos pantallas frontend del POS:
1) /pages/reports (Reporte de Caja y Contabilidad)
2) /pages/cash-module (Dashboard financiero de caja)

El frontend Angular ya está implementado y consume endpoints concretos.
Debemos respetar el contrato para que funcione sin cambios.

========================
BASE DE DATOS (fuente)
========================

Tablas principales:
- pos_tbl_factura
  campos clave: rowid, rowid_compania, rowid_usuario, rowid_estado, numero_factura, fecha_factura, rowid_cliente, nombre_cliente, nit_cliente, subtotal, subtotal_bruto, descuento_general, total_iva, total_factura, fecha_creacion
- pos_tbl_detalle_factura
  campos clave: rowid_factura, rowid_producto, cantidad, precio_unitario, porcentaje_descuento, valor_descuento, subtotal, total, iva, valor_iva
- pos_tbl_docto_compra
  campos clave: rowid, rowid_compania, rowid_usuario, rowid_proveedor, rowid_estado, orden_compra, factura_proveedor, fecha_factura, consecutivo, subTotal, total, estado, fecha_creacion
- pos_tbl_detalle_compra
  campos clave: rowid_docto_compra, rowid_producto, rowid_bodega, cantidad, precio_unitario, subtotal, iva, total, fecha_creacion
- pos_tbl_financiacion
  campos clave: rowid, rowid_compania, rowid_factura, rowid_cliente, total_financiado, saldo_actual, tasa_interes, cuotas_totales, fecha_inicio, fecha_vencimiento, estado, fecha_creacion, fecha_actualizacion
- pos_tbl_financiacion_pagos
  campos clave: rowid, rowid_compania, rowid_financiacion, valor_pago, fecha_pago, metodo_pago, saldo_restante, observaciones, usuario_registro, fecha_registro, numero_recibo

Notas:
- rowid_usuario = vendedor/usuario responsable.
- rowid_* apunta a maestros.
- yo me encargo del SQL fino e índices, pero necesito los endpoints y contratos estables.

========================
FILTROS COMUNES
========================

Todos los endpoints reciben por query:
- companiaId (required)
- startDate (required, formato yyyy-MM-dd)
- endDate (required, formato yyyy-MM-dd)
- userId (optional)
- estadoId (optional)

Formato de respuesta estándar:
{
  "code": 0,
  "message": "ok",
  "data": ...
}

========================
ENDPOINTS YA CONECTADOS DESDE FRONTEND
========================

A) Reporte de Caja y Contabilidad (/pages/reports)

1) GET /api/Reports/GetFinancialSummary
Response data:
{
  "ventasBrutas": number,
  "descuentos": number,
  "ivaVentas": number,
  "ventasNetas": number,
  "comprasTotales": number,
  "ivaCompras": number,
  "utilidadBruta": number,
  "carteraTotal": number,
  "carteraVencida": number,
  "recaudoCartera": number
}

2) GET /api/Reports/GetCashFlow
Response data:
[
  {
    "periodo": "yyyy-MM-dd",
    "ingresos": number,
    "egresos": number,
    "neto": number
  }
]

3) GET /api/Reports/GetSales
Response data:
{
  "rows": [
    {
      "facturaId": number,
      "numeroFactura": string,
      "fechaFactura": "yyyy-MM-ddTHH:mm:ss",
      "cliente": string,
      "nitCliente": string,
      "vendedorId": number,
      "vendedorNombre": string,
      "subtotal": number,
      "subtotalBruto": number,
      "descuentoGeneral": number,
      "totalIva": number,
      "totalFactura": number,
      "estadoId": number,
      "estadoNombre": string
    }
  ],
  "totalRows": number
}

4) GET /api/Reports/GetPurchases
Response data:
{
  "rows": [
    {
      "doctoCompraId": number,
      "consecutivo": number,
      "facturaProveedor": string,
      "fechaFactura": "yyyy-MM-ddTHH:mm:ss",
      "proveedorId": number,
      "proveedorNombre": string,
      "usuarioId": number,
      "usuarioNombre": string,
      "subTotal": number,
      "total": number,
      "estadoId": number,
      "estadoNombre": string
    }
  ],
  "totalRows": number
}

5) GET /api/Reports/GetFinancing
Response data:
[
  {
    "financiacionId": number,
    "facturaId": number,
    "clienteId": number,
    "clienteNombre": string,
    "totalFinanciado": number,
    "saldoActual": number,
    "tasaInteres": number,
    "cuotasTotales": number,
    "fechaInicio": "yyyy-MM-ddTHH:mm:ss",
    "fechaVencimiento": "yyyy-MM-ddTHH:mm:ss",
    "estado": string,
    "pagadoAcumulado": number
  }
]

B) Dashboard Cash Module (/pages/cash-module)

6) GET /api/Reports/GetCashDashboardSummary
Response data:
{
  "ingresos": number,
  "egresos": number,
  "neto": number,
  "efectivo": number,
  "tarjetas": number,
  "transferencias": number,
  "financiado": number,
  "transacciones": number,
  "ticketPromedio": number
}

7) GET /api/Reports/GetPaymentMix
Response data:
[
  {
    "metodo": string,
    "valor": number,
    "porcentaje": number
  }
]

8) GET /api/Reports/GetRecentCashMovements
Response data:
[
  {
    "id": number|string,
    "fecha": "yyyy-MM-ddTHH:mm:ss",
    "descripcion": string,
    "categoria": string,
    "metodoPago": string,
    "tipo": "income" | "expense",
    "monto": number,
    "referencia": string,
    "usuarioId": number,
    "usuarioNombre": string
  }
]

C) Exportables (usado en reports y cash-module)

9) GET /api/Reports/Export
Query adicional:
- section: full | summary | cashflow | sales | purchases | financing
- format: xlsx | pdf | csv

Debe devolver archivo (stream) con Content-Type correcto:
- xlsx: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- pdf: application/pdf
- csv: text/csv

Nombre sugerido de archivo en Content-Disposition.

========================
REGLAS DE NEGOCIO / CÁLCULO
========================

Sugerencia de agregaciones:
- ventasBrutas = SUM(factura.subtotal_bruto)
- descuentos = SUM(factura.descuento_general) + SUM(detalle_factura.valor_descuento)
- ivaVentas = SUM(factura.total_iva) (o reconciliado con detalle_factura.valor_iva)
- ventasNetas = SUM(factura.total_factura)
- comprasTotales = SUM(docto_compra.total)
- ivaCompras = SUM(detalle_compra.iva) o SUM(detalle_compra.total - detalle_compra.subtotal)
- utilidadBruta = ventasNetas - comprasTotales
- carteraTotal = SUM(financiacion.saldo_actual)
- carteraVencida = SUM(saldo_actual donde fecha_vencimiento < hoy y saldo_actual > 0)
- recaudoCartera = SUM(financiacion_pagos.valor_pago) en rango

CashDashboardSummary:
- ingresos: entradas del periodo (ventas cobradas + recaudos)
- egresos: compras/pagos/salidas del periodo
- neto = ingresos - egresos
- efectivo/tarjetas/transferencias/financiado: según método de pago
- transacciones: conteo de movimientos
- ticketPromedio = ingresos / transacciones (cuando transacciones > 0)

GetRecentCashMovements:
- unificar movimientos de ventas, compras y pagos financiación en shape homogéneo
- mapear tipo:
  - income: ventas/recaudos
  - expense: compras/salidas

========================
CONSIDERACIONES TÉCNICAS
========================

- Manejar zona horaria Colombia.
- No romper contrato ApiResponse<T>.
- Permitir nulos en userId/estadoId sin filtrar por esos campos.
- Validar startDate <= endDate.
- Optimizar consultas para rango de fechas (índices o vistas/SP si aplica).
- Mantener precisión financiera decimal.
- Incluir fallback de estadoNombre/vendedorNombre/proveedorNombre/clienteNombre si no hay join maestro.
- En exportables, usar exactamente los filtros recibidos.

========================
PRUEBAS MÍNIMAS
========================

- Probar con:
  - solo compania + rango
  - compania + rango + userId
  - compania + rango + estadoId
- Probar export full y cashflow en xlsx/pdf/csv
- Verificar code/message/data y tipos JSON exactos.
```

---

## 7) Notas extra para coordinación

- Ruta frontend reportes: `src/app/components/pages/reports/`
- Ruta frontend cash dashboard: `src/app/components/pages/cash/`
- Servicio backend bridge: `src/app/components/services/reports.service.ts`
- Campo nuevo cliente mayorista: `isWholesale`

---

## 8) Verificación técnica

Build ejecutado localmente:
- `npm run build` -> OK (solo warnings CommonJS no bloqueantes: pdfmake/crypto-js)
