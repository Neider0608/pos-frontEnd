/**
 * Bootstrap file para convertir PromotionsComponent en un Web Component
 * Este archivo permite usar el componente como microfrontend
 * 
 * Uso:
 * 1. Importar este archivo en la aplicación host
 * 2. Llamar a registerPromotionsElement() antes de usar el componente
 * 3. Usar <promotions-microfrontend></promotions-microfrontend> en el HTML
 */

import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { PromotionsComponent } from './promotions.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';

registerLocaleData(localeEsCO);

/**
 * Configuración mínima para el microfrontend
 * Solo incluye lo esencial para que el componente funcione
 */
const microfrontendConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } }
    }),
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ]
};

/**
 * Función para registrar el componente como Web Component
 * Uso: Llamar a esta función después de que Angular esté inicializado
 * 
 * @example
 * ```typescript
 * import { registerPromotionsElement } from './promotions-element';
 * await registerPromotionsElement();
 * ```
 */
export async function registerPromotionsElement(): Promise<void> {
  try {
    // Crear aplicación Angular standalone con configuración mínima
    const app = await createApplication(microfrontendConfig);
    
    // Crear el elemento personalizado desde el componente
    const promotionsElement = createCustomElement(PromotionsComponent, {
      injector: app.injector
    });
    
    // Registrar el elemento personalizado
    if (!customElements.get('promotions-microfrontend')) {
      customElements.define('promotions-microfrontend', promotionsElement);
      console.log('✅ Promotions Microfrontend registrado como <promotions-microfrontend>');
    } else {
      console.warn('⚠️ promotions-microfrontend ya está registrado');
    }
  } catch (error) {
    console.error('❌ Error al registrar Promotions Microfrontend:', error);
    throw error;
  }
}

/**
 * Función para desregistrar el componente (útil para hot reload)
 */
export function unregisterPromotionsElement(): void {
  if (customElements.get('promotions-microfrontend')) {
    customElements.undefine('promotions-microfrontend');
    console.log('🗑️ Promotions Microfrontend desregistrado');
  }
}
