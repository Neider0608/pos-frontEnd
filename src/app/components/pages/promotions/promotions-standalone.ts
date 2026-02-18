/**
 * Archivo standalone para cargar el microfrontend de promociones
 * Puede ser usado con Module Federation o como módulo independiente
 */

import { Component } from '@angular/core';
import { PromotionsComponent } from './promotions.component';

/**
 * Wrapper component para usar PromotionsComponent como microfrontend
 * Expone el componente para ser cargado dinámicamente
 */
@Component({
  selector: 'promotions-standalone',
  standalone: true,
  imports: [PromotionsComponent],
  template: `<app-promotions></app-promotions>`
})
export class PromotionsStandaloneComponent {}

// Exportar el componente principal para uso externo
export { PromotionsComponent };
