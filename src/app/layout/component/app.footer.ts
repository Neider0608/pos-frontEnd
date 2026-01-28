import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [CommonModule],
    template: `
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-2">
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"> © {{ currentYear }} TODOS LOS DERECHOS RESERVADOS </span>
                <div class="h-1 w-1 rounded-full bg-slate-300"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 pointer-events-none"> v2.4.0 </span>
            </div>

            <div class="flex items-center gap-1">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Powered by</span>
                <a href="https://neidsoft.com" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-2 no-underline">
                    <span class="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 group-hover:text-blue-600 transition-all duration-300"> NEIDSOFT </span>
                    <div class="h-3 w-[1.5px] bg-slate-200 group-hover:bg-blue-200 transition-colors"></div>
                    <span class="text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors"> S.A.S </span>
                </a>
            </div>
        </div>
    `
})
export class AppFooter {
    // Propiedad dinámica para el año
    currentYear: number = new Date().getFullYear();
}
