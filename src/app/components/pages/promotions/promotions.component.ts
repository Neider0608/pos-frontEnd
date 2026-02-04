import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
/* import { InputTextareaModule } from 'primeng/inputtextarea'; */
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { Promotion } from '../api/promotions';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-promotions',
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        InputTextModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        /*  InputTextareaModule, */
        InputNumberModule,
        CalendarModule,
        CheckboxModule,
        SelectButtonModule,
        TableModule,
        TagModule,
        TabViewModule,
        BadgeModule,
        InputSwitchModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './promotions.component.html',
    styleUrl: './promotions.component.scss'
})
export class PromotionsComponent implements OnInit {
    searchTerm: string = '';
    showAddDialog: boolean = false;
    selectedType: string = 'all';

    currentPromotion: Promotion = {
        id: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        applicableProducts: [],
        applicableCategories: [],
        usageCount: 0,
        createdBy: 'María González',
        createdAt: new Date().toISOString()
    };

    promotions: Promotion[] = [
        {
            id: '1',
            name: 'Descuento Fin de Semana',
            description: '15% de descuento en todas las bebidas',
            type: 'percentage',
            value: 15,
            minPurchase: 50,
            startDate: '2024-01-15',
            endDate: '2024-01-31',
            isActive: true,
            applicableProducts: [],
            applicableCategories: ['Bebidas'],
            usageLimit: 100,
            usageCount: 23,
            createdBy: 'María González',
            createdAt: '2024-01-10T10:00:00'
        },
        {
            id: '2',
            name: 'Compra 2 Lleva 3',
            description: 'En productos de panadería',
            type: 'buy_x_get_y',
            value: 2, // buy 2 get 1 free
            startDate: '2024-01-01',
            endDate: '2024-02-29',
            isActive: true,
            applicableProducts: [],
            applicableCategories: ['Panadería'],
            usageCount: 45,
            createdBy: 'Carlos Pérez',
            createdAt: '2024-01-01T08:00:00'
        },
        {
            id: '3',
            name: 'Descuento Cliente VIP',
            description: '$20 de descuento en compras mayores a $200',
            type: 'fixed_amount',
            value: 20,
            minPurchase: 200,
            maxDiscount: 20,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            isActive: true,
            applicableProducts: [],
            applicableCategories: [],
            usageCount: 12,
            createdBy: 'María González',
            createdAt: '2024-01-01T00:00:00'
        },
        {
            id: '4',
            name: 'Combo Desayuno',
            description: 'Pan + Leche + Café por $15',
            type: 'bundle',
            value: 15,
            startDate: '2024-01-10',
            endDate: '2024-01-25',
            isActive: false,
            applicableProducts: ['Pan Integral', 'Leche Entera 1L', 'Café Juan Valdez'],
            applicableCategories: [],
            usageCount: 8,
            createdBy: 'Carlos Pérez',
            createdAt: '2024-01-08T14:00:00'
        }
    ];

    categories: string[] = ['Bebidas', 'Lácteos', 'Panadería', 'Granos', 'Aceites', 'Aseo', 'Snacks'];
    products: string[] = ['Coca Cola 350ml', 'Pan Integral', 'Leche Entera 1L', 'Arroz Diana 500g', 'Café Juan Valdez', 'Aceite Girasol 1L'];

    promotionTypes = [
        { label: 'Todos los tipos', value: 'all' },
        { label: 'Porcentaje', value: 'percentage' },
        { label: 'Monto Fijo', value: 'fixed_amount' },
        { label: 'Compra X Lleva Y', value: 'buy_x_get_y' },
        { label: 'Combo', value: 'bundle' }
    ];

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {}

    get activePromotions(): number {
        return this.promotions.filter((p) => p.isActive).length;
    }

    get totalUsage(): number {
        return this.promotions.reduce((sum, p) => sum + p.usageCount, 0);
    }

    get expiringSoon(): number {
        return this.promotions.filter((p) => {
            const endDate = new Date(p.endDate);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays > 0;
        }).length;
    }

    savePromotion() {
        if (!this.currentPromotion.name || !this.currentPromotion.description || this.currentPromotion.value === undefined) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor completa todos los campos obligatorios' });
            return;
        }

        console.log('Guardando promoción:', this.currentPromotion);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Promoción guardada exitosamente' });
        this.showAddDialog = false;
        this.resetCurrentPromotion();
    }

    resetCurrentPromotion() {
        this.currentPromotion = {
            id: '',
            name: '',
            description: '',
            type: 'percentage',
            value: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
            applicableProducts: [],
            applicableCategories: [],
            usageCount: 0,
            createdBy: 'María González',
            createdAt: new Date().toISOString()
        };
    }

    // Method to handle editing a promotion
    editPromotion(promotion: Promotion) {
        // Use the spread operator in TypeScript to create a new object
        // This is valid and recommended in TS/JS, just not directly in Angular templates
        this.currentPromotion = { ...promotion };
        this.showAddDialog = true;
    }

    getPromotionTypeBadge(type: string): string {
        switch (type) {
            case 'percentage':
                return 'Porcentaje';
            case 'fixed_amount':
                return 'Monto Fijo';
            case 'buy_x_get_y':
                return 'Compra X Lleva Y';
            case 'bundle':
                return 'Combo';
            default:
                return type;
        }
    }

    // Explicitly define the return type as a union of the allowed severity strings for p-badge
    getPromotionTypeBadgeSeverity(type: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (type) {
            case 'percentage':
                return 'info';
            case 'fixed_amount':
                return 'warn';
            case 'buy_x_get_y':
                return 'success';
            case 'bundle':
                return 'contrast';
            default:
                return 'secondary';
        }
    }

    // Returns PrimeIcons class string
    getPromotionIconClass(type: string): string {
        switch (type) {
            case 'percentage':
                return 'pi pi-percent';
            case 'fixed_amount':
                return 'pi pi-tag';
            case 'buy_x_get_y':
                return 'pi pi-gift';
            case 'bundle':
                return 'pi pi-star';
            default:
                return 'pi pi-tag';
        }
    }

    get filteredPromotions(): Promotion[] {
        return this.promotions.filter((promotion) => {
            const matchesSearch = promotion.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesType = this.selectedType === 'all' || promotion.type === this.selectedType;
            return matchesSearch && matchesType;
        });
    }

    onCategoryChange(category: string, event: any) {
        if (event.checked) {
            this.currentPromotion.applicableCategories = [...this.currentPromotion.applicableCategories, category];
        } else {
            this.currentPromotion.applicableCategories = this.currentPromotion.applicableCategories.filter((c) => c !== category);
        }
    }

    onProductChange(product: string, event: any) {
        if (event.checked) {
            this.currentPromotion.applicableProducts = [...this.currentPromotion.applicableProducts, product];
        } else {
            this.currentPromotion.applicableProducts = this.currentPromotion.applicableProducts.filter((p) => p !== product);
        }
    }
}
