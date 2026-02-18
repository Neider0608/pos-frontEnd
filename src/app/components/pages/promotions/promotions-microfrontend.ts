/**
 * Punto de entrada para el microfrontend de Promociones como Web Component
 * Este archivo puede ser compilado independientemente para generar el bundle del microfrontend
 */

import { registerPromotionsElement } from './promotions-element';

// Auto-registrar cuando se carga el script
if (typeof window !== 'undefined') {
  registerPromotionsElement().catch(err => {
    console.error('Error al inicializar Promotions Microfrontend:', err);
  });
}

// Exportar para uso manual
export { registerPromotionsElement, unregisterPromotionsElement } from './promotions-element';
export { PromotionsComponent } from './promotions.component';
