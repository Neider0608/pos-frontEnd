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
import { TextareaModule } from 'primeng/textarea';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Promotion } from '../api/promotions';
import { MessageService } from 'primeng/api';
import { MasterService } from '../../services/master.service';
import { InventoryService } from '../../services/inventory.service';
import { Category, Product } from '../api/shared';
import { PromotionsService } from '../../services/promotions.service';
import { AuthService } from '../core/guards/auth.service';
import { LoginService } from '../../services/login.service';
import { AuthSession } from '../api/login';


@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    TextareaModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TabViewModule,
    BadgeModule,
    InputSwitchModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [
    MessageService,
    PromotionsService,
    MasterService,
    InventoryService,
    AuthService,
    LoginService
  ],
  templateUrl: './promotions.component.html',
  styleUrl: './promotions.component.scss'
})
export class PromotionsComponent implements OnInit {

  searchTerm: string = '';
  showAddDialog: boolean = false;
  showConfirmStatusDialog: boolean = false;
  selectedType: string = 'all';
  isEditing: boolean = false;
  loading: boolean = false;
  promotionToToggle: Promotion | null = null;
  newStatus: boolean = false;

  currentPromotion: Promotion = {
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    categoryIds: [],
    productIds: [],
    freeCategoryIds: [],
    freeProductIds: [],
    usageCount: 0,
  };

  // Fechas como Date para los calendarios de PrimeNG
  startDateModel: Date | null = null;
  endDateModel: Date | null = null;

  promotions: Promotion[] = [];

  // Listas para dropdowns
  categories: any[] = [];
  products: any[] = [];
  
  // Listas completas para checkboxes
  allCategories: Category[] = [];
  allProducts: Product[] = [];

  promotionTypes = [
    { label: 'Todos los tipos', value: 'all' },
    { label: 'Porcentaje', value: 'percentage' },
    { label: 'Monto Fijo', value: 'fixed_amount' },
    { label: 'Compra X Lleva Y', value: 'buy_x_get_y' },
    { label: 'Combo', value: 'bundle' },
  ];

  companiaId: number = 0;
  userId: number = 0;

  constructor(
    private messageService: MessageService,
    private promotionsService: PromotionsService,
    private masterService: MasterService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    const session = this.authService.getSession() as AuthSession;

    if (!session) {
      return;
    }

    const { userId, companiaId } = session;
    this.companiaId = companiaId;
    this.userId = userId;

    this.loadPromotions();
    this.loadCategories();
    this.loadProducts();
  }

  // ============================================================
  // 🔹 CARGA DE DATOS
  // ============================================================

  loadPromotions() {
    this.loading = true;
    this.promotionsService.getPromotions(this.companiaId).subscribe({
      next: (res) => {
        this.promotions = (res.data || []).map(p => {
          // Normalizar categoryIds
          let categoryIds: number[] = [];
          if (p.categoryIds && p.categoryIds.length > 0) {
            categoryIds = p.categoryIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          } else if (p.categories && p.categories.length > 0) {
            categoryIds = p.categories
              .map((c: any) => c.id)
              .filter((id: any) => id != null)
              .map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
              .filter((id: any) => !isNaN(id));
          }

          // Normalizar productIds
          let productIds: number[] = [];
          if (p.productIds && p.productIds.length > 0) {
            productIds = p.productIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          } else if (p.products && p.products.length > 0) {
            productIds = p.products
              .map((pr: any) => pr.id)
              .filter((id: any) => id != null)
              .map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
              .filter((id: any) => !isNaN(id));
          }

          // Normalizar freeCategoryIds y freeProductIds (para buy_x_get_y)
          let freeCategoryIds: number[] = [];
          if (p.freeCategoryIds && p.freeCategoryIds.length > 0) {
            freeCategoryIds = p.freeCategoryIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          }

          let freeProductIds: number[] = [];
          if (p.freeProductIds && p.freeProductIds.length > 0) {
            freeProductIds = p.freeProductIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          }

          return {
            ...p,
            // Normalizar fechas a formato string si vienen como Date
            startDate: p.startDate ? (typeof p.startDate === 'string' ? p.startDate : new Date(p.startDate as any).toISOString().split('T')[0]) : undefined,
            endDate: p.endDate ? (typeof p.endDate === 'string' ? p.endDate : new Date(p.endDate as any).toISOString().split('T')[0]) : undefined,
            categoryIds: categoryIds,
            productIds: productIds,
            freeCategoryIds: freeCategoryIds,
            freeProductIds: freeProductIds
          };
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las promociones.'
        });
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.masterService.getCategories(this.companiaId).subscribe({
      next: (res) => {
        this.allCategories = res.data || [];
        this.categories = this.allCategories
          .filter(c => c.active)
          .map(c => ({
            label: c.name,
            value: c.id
          }));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar las categorías.'
        });
      }
    });
  }

  loadProducts() {
    this.inventoryService.getProducts(this.companiaId).subscribe({
      next: (res) => {
        this.allProducts = res.data || [];
        this.products = this.allProducts
          .filter(p => p.active)
          .map(p => ({
            label: p.name,
            value: p.id
          }));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar los productos.'
        });
      }
    });
  }


  get activePromotions(): number {
    return this.promotions.filter((p) => p.isActive).length;
  }

  get totalUsage(): number {
    return this.promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0);
  }

  get expiringSoon(): number {
    return this.promotions.filter((p) => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length;
  }

  // ============================================================
  // ⚙️ FUNCIONES DE CRUD
  // ============================================================

  openAddDialog() {
    this.isEditing = false;
    this.currentPromotion = this.getEmptyPromotion();
    // Inicializar fechas para los calendarios
    this.startDateModel = new Date();
    this.endDateModel = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.showAddDialog = true;
  }

  // Función para inicializar arrays cuando cambia el tipo de promoción
  onPromotionTypeChange() {
    // Asegurar que los arrays estén inicializados
    if (!this.currentPromotion.categoryIds) this.currentPromotion.categoryIds = [];
    if (!this.currentPromotion.productIds) this.currentPromotion.productIds = [];
    if (!this.currentPromotion.freeCategoryIds) this.currentPromotion.freeCategoryIds = [];
    if (!this.currentPromotion.freeProductIds) this.currentPromotion.freeProductIds = [];
  }

  editPromotion(promotion: Promotion) {
    if (!promotion.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede editar una promoción sin ID.'
      });
      return;
    }

    this.isEditing = true;
    this.loading = true;
    
    // Cargar la promoción completa desde el backend para obtener categorías y productos
    this.promotionsService.getPromotionById(promotion.id, this.companiaId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data && res.data.length > 0) {
          const fullPromotion = res.data[0];
          
          // Normalizar categoryIds - convertir a números y manejar diferentes fuentes
          let categoryIds: number[] = [];
          if (fullPromotion.categoryIds && fullPromotion.categoryIds.length > 0) {
            categoryIds = fullPromotion.categoryIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          } else if (fullPromotion.categories && fullPromotion.categories.length > 0) {
            categoryIds = fullPromotion.categories
              .map((c: any) => c.id)
              .filter((id: any) => id != null)
              .map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
              .filter((id: any) => !isNaN(id));
          }

          // Normalizar productIds - convertir a números y manejar diferentes fuentes
          let productIds: number[] = [];
          if (fullPromotion.productIds && fullPromotion.productIds.length > 0) {
            productIds = fullPromotion.productIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          } else if (fullPromotion.products && fullPromotion.products.length > 0) {
            productIds = fullPromotion.products
              .map((pr: any) => pr.id)
              .filter((id: any) => id != null)
              .map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
              .filter((id: any) => !isNaN(id));
          }

          // Normalizar freeCategoryIds y freeProductIds (para buy_x_get_y)
          let freeCategoryIds: number[] = [];
          if (fullPromotion.freeCategoryIds && fullPromotion.freeCategoryIds.length > 0) {
            freeCategoryIds = fullPromotion.freeCategoryIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          }

          let freeProductIds: number[] = [];
          if (fullPromotion.freeProductIds && fullPromotion.freeProductIds.length > 0) {
            freeProductIds = fullPromotion.freeProductIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));
          }

          // Crear una copia profunda para evitar problemas de referencia
          this.currentPromotion = { 
            ...fullPromotion,
            companiaId: this.companiaId,
            categoryIds: categoryIds.length > 0 ? [...categoryIds] : [],
            productIds: productIds.length > 0 ? [...productIds] : [],
            freeCategoryIds: freeCategoryIds.length > 0 ? [...freeCategoryIds] : [],
            freeProductIds: freeProductIds.length > 0 ? [...freeProductIds] : [],
            // Asegurar que isActive sea siempre un booleano
            isActive: fullPromotion.isActive !== null && fullPromotion.isActive !== undefined ? Boolean(fullPromotion.isActive) : true
          };
          
          // Convertir fechas string a objetos Date para los calendarios
          if (this.currentPromotion.startDate) {
            const startDateStr = typeof this.currentPromotion.startDate === 'string' 
              ? this.currentPromotion.startDate 
              : new Date(this.currentPromotion.startDate as any).toISOString().split('T')[0];
            this.startDateModel = new Date(startDateStr);
            this.currentPromotion.startDate = startDateStr;
          } else {
            this.startDateModel = new Date();
            this.currentPromotion.startDate = this.startDateModel.toISOString().split('T')[0];
          }
          
          if (this.currentPromotion.endDate) {
            const endDateStr = typeof this.currentPromotion.endDate === 'string' 
              ? this.currentPromotion.endDate 
              : new Date(this.currentPromotion.endDate as any).toISOString().split('T')[0];
            this.endDateModel = new Date(endDateStr);
            this.currentPromotion.endDate = endDateStr;
          } else {
            this.endDateModel = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            this.currentPromotion.endDate = this.endDateModel.toISOString().split('T')[0];
          }
          
          this.showAddDialog = true;
          
          console.log('Promoción cargada para editar:', {
            nombre: this.currentPromotion.name,
            categoryIds: this.currentPromotion.categoryIds,
            productIds: this.currentPromotion.productIds
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la promoción para editar.'
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la promoción para editar.'
        });
      }
    });
  }

  deletePromotion(promotion: Promotion) {
    if (!confirm(`¿Eliminar la promoción "${promotion.name}"?`)) return;

    this.promotionsService.deletePromotion(promotion).subscribe({
      next: (res) => {
        if (res.code === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Eliminado',
            detail: 'Promoción eliminada correctamente.'
          });
          this.loadPromotions();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la promoción.'
        });
      }
    });
  }

  savePromotion() {
    // Validaciones
    if (!this.currentPromotion.name?.trim()) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'El nombre es obligatorio' 
      });
      return;
    }

    if (!this.currentPromotion.description?.trim()) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'La descripción es obligatoria' 
      });
      return;
    }

    if (this.currentPromotion.value === undefined || this.currentPromotion.value <= 0) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'El valor debe ser mayor a 0' 
      });
      return;
    }

    // Obtener fechas de los modelos Date o de los strings
    const startDate = this.startDateModel || (this.currentPromotion.startDate ? new Date(this.currentPromotion.startDate) : null);
    const endDate = this.endDateModel || (this.currentPromotion.endDate ? new Date(this.currentPromotion.endDate) : null);
    
    if (!startDate || !endDate) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Las fechas de inicio y fin son obligatorias' 
      });
      return;
    }
    
    if (endDate < startDate) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'La fecha de fin debe ser posterior a la fecha de inicio' 
      });
      return;
    }

    // Validaciones específicas por tipo
    if (this.currentPromotion.type === 'percentage' && this.currentPromotion.value > 100) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'El porcentaje no puede ser mayor a 100%' 
      });
      return;
    }

    if (this.currentPromotion.type === 'fixed_amount' && this.currentPromotion.minPurchase && 
        this.currentPromotion.value >= this.currentPromotion.minPurchase) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'El descuento debe ser menor al monto mínimo de compra' 
      });
      return;
    }

    // Validaciones para buy_x_get_y
    if (this.currentPromotion.type === 'buy_x_get_y') {
      if (!this.currentPromotion.buyY || this.currentPromotion.buyY < 1) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Debe especificar la cantidad de productos que se llevan gratis (Y)' 
        });
        return;
      }
      
      // Asegurar que los arrays estén inicializados
      if (!this.currentPromotion.categoryIds) this.currentPromotion.categoryIds = [];
      if (!this.currentPromotion.productIds) this.currentPromotion.productIds = [];
      if (!this.currentPromotion.freeCategoryIds) this.currentPromotion.freeCategoryIds = [];
      if (!this.currentPromotion.freeProductIds) this.currentPromotion.freeProductIds = [];
      
      // Verificar que haya al menos una categoría o producto para comprar
      const hasBuyItems = (this.currentPromotion.categoryIds.length > 0) ||
                          (this.currentPromotion.productIds.length > 0);
      
      if (!hasBuyItems) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Debe seleccionar al menos una categoría o producto para comprar' 
        });
        return;
      }

      // Verificar que haya al menos una categoría o producto gratis
      const hasFreeItems = (this.currentPromotion.freeCategoryIds.length > 0) ||
                           (this.currentPromotion.freeProductIds.length > 0);
      
      // Debug temporal
      console.log('Validación buy_x_get_y:', {
        freeCategoryIds: this.currentPromotion.freeCategoryIds,
        freeProductIds: this.currentPromotion.freeProductIds,
        hasFreeItems
      });
      
      if (!hasFreeItems) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Debe seleccionar al menos una categoría o producto que se llevará gratis' 
        });
        return;
      }
    }

    // Preparar datos para envío
    const promotionToSave: Promotion = {
      ...this.currentPromotion,
      companiaId: this.companiaId,
      userId: this.userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      // Asegurar que isActive sea siempre un booleano
      isActive: this.currentPromotion.isActive !== null && this.currentPromotion.isActive !== undefined ? Boolean(this.currentPromotion.isActive) : true,
      // Asegurar que categoryIds sea un array de números (no strings)
      categoryIds: this.currentPromotion.categoryIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id as number)) || [],
      // Asegurar que productIds sea un array de números (no strings)
      productIds: this.currentPromotion.productIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id as number)) || [],
      // Asegurar que freeCategoryIds y freeProductIds sean arrays de números (para buy_x_get_y)
      freeCategoryIds: this.currentPromotion.freeCategoryIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id as number)) || [],
      freeProductIds: this.currentPromotion.freeProductIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id as number)) || [],
    };

    const operation = this.isEditing 
      ? this.promotionsService.updatePromotion(promotionToSave)
      : this.promotionsService.createPromotion(promotionToSave);

    this.loading = true;
    operation.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.code === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: this.isEditing ? 'Promoción actualizada correctamente.' : 'Promoción creada correctamente.'
          });
          this.showAddDialog = false;
          this.loadPromotions();
          this.resetCurrentPromotion();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la promoción.'
        });
      }
    });
  }

  resetCurrentPromotion() {
    this.currentPromotion = this.getEmptyPromotion();
    this.startDateModel = null;
    this.endDateModel = null;
    this.isEditing = false;
  }

  getEmptyPromotion(): Promotion {
    return {
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      companiaId: this.companiaId,
      categoryIds: [],
      productIds: [],
      freeCategoryIds: [],
      freeProductIds: [],
      usageCount: 0,
    };
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

  onCategoryChange(categoryId: number, event: any) {
    if (event.checked) {
      if (!this.currentPromotion.categoryIds) {
        this.currentPromotion.categoryIds = [];
      }
      if (!this.currentPromotion.categoryIds.includes(categoryId)) {
        this.currentPromotion.categoryIds = [...this.currentPromotion.categoryIds, categoryId];
      }
    } else {
      this.currentPromotion.categoryIds = this.currentPromotion.categoryIds?.filter(c => c !== categoryId) || [];
    }
  }

  isCategorySelected(categoryId: number | undefined): boolean {
    // Asegurar que categoryIds esté inicializado
    if (!this.currentPromotion.categoryIds) {
      this.currentPromotion.categoryIds = [];
    }
    
    if (!categoryId && categoryId !== 0) {
      return false;
    }
    
    // Normalizar el ID de la categoría a número
    const normalizedCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : Number(categoryId);
    
    // Verificar que el ID normalizado sea válido
    if (isNaN(normalizedCategoryId)) {
      return false;
    }
    
    // Comparar con los IDs de la promoción actual (normalizados también)
    const result = this.currentPromotion.categoryIds.some(id => {
      const normalizedId = typeof id === 'string' ? parseInt(String(id), 10) : Number(id);
      return !isNaN(normalizedId) && normalizedId === normalizedCategoryId;
    });
    
    return result;
  }

  onProductChange(productId: number, event: any) {
    if (event.checked) {
      if (!this.currentPromotion.productIds) {
        this.currentPromotion.productIds = [];
      }
      if (!this.currentPromotion.productIds.includes(productId)) {
        this.currentPromotion.productIds = [...this.currentPromotion.productIds, productId];
      }
    } else {
      this.currentPromotion.productIds = this.currentPromotion.productIds?.filter(p => p !== productId) || [];
    }
  }

  isProductSelected(productId: number | undefined): boolean {
    if (!this.currentPromotion.productIds || !productId) return false;
    // Normalizar ambos valores a números para comparación
    const normalizedProductId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
    return this.currentPromotion.productIds.some(id => {
      const normalizedId = typeof id === 'string' ? parseInt(id, 10) : id;
      return normalizedId === normalizedProductId;
    });
  }

  // Funciones helper para mostrar nombres de categorías y productos
  getCategoryNames(categoryIds?: number[]): string {
    if (!categoryIds || categoryIds.length === 0) return 'Todas las categorías';
    const names = categoryIds
      .map(id => this.allCategories.find(c => c.id === id)?.name)
      .filter(name => name != null);
    return names.length > 0 ? names.join(', ') : 'Sin categorías';
  }

  getProductNames(productIds?: number[]): string {
    if (!productIds || productIds.length === 0) return 'Todos los productos';
    const names = productIds
      .map(id => this.allProducts.find(p => p.id === id)?.name)
      .filter(name => name != null);
    return names.length > 0 ? names.join(', ') : 'Sin productos';
  }

  getCategoryCount(categoryIds?: number[]): number {
    if (!categoryIds || categoryIds.length === 0) return 0;
    return categoryIds.length;
  }

  getProductCount(productIds?: number[]): number {
    if (!productIds || productIds.length === 0) return 0;
    return productIds.length;
  }

  // Funciones para manejar cambios en los calendarios
  onStartDateChange(date: Date | null) {
    if (date) {
      this.startDateModel = date;
      this.currentPromotion.startDate = date.toISOString().split('T')[0];
    }
  }

  onEndDateChange(date: Date | null) {
    if (date) {
      this.endDateModel = date;
      this.currentPromotion.endDate = date.toISOString().split('T')[0];
    }
  }

  // Funciones para manejar productos/categorías GRATIS (para buy_x_get_y)
  onFreeCategoryChange(categoryId: number, event: any) {
    // Asegurar que el array esté inicializado
    if (!this.currentPromotion.freeCategoryIds) {
      this.currentPromotion.freeCategoryIds = [];
    }
    
    if (event.checked) {
      const normalizedId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : Number(categoryId);
      if (!isNaN(normalizedId) && !this.currentPromotion.freeCategoryIds.includes(normalizedId)) {
        this.currentPromotion.freeCategoryIds = [...this.currentPromotion.freeCategoryIds, normalizedId];
      }
    } else {
      const normalizedId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : Number(categoryId);
      this.currentPromotion.freeCategoryIds = this.currentPromotion.freeCategoryIds.filter(c => {
        const normalizedC = typeof c === 'string' ? parseInt(String(c), 10) : Number(c);
        return normalizedC !== normalizedId;
      });
    }
    
    console.log('onFreeCategoryChange:', {
      categoryId,
      freeCategoryIds: this.currentPromotion.freeCategoryIds,
      checked: event.checked
    });
  }

  isFreeCategorySelected(categoryId: number | undefined): boolean {
    if (!this.currentPromotion.freeCategoryIds) {
      this.currentPromotion.freeCategoryIds = [];
    }
    if (!categoryId && categoryId !== 0) {
      return false;
    }
    const normalizedCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : Number(categoryId);
    if (isNaN(normalizedCategoryId)) {
      return false;
    }
    return this.currentPromotion.freeCategoryIds.some(id => {
      const normalizedId = typeof id === 'string' ? parseInt(String(id), 10) : Number(id);
      return !isNaN(normalizedId) && normalizedId === normalizedCategoryId;
    });
  }

  onFreeProductChange(productId: number, event: any) {
    // Asegurar que el array esté inicializado
    if (!this.currentPromotion.freeProductIds) {
      this.currentPromotion.freeProductIds = [];
    }
    
    if (event.checked) {
      const normalizedId = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
      if (!isNaN(normalizedId) && !this.currentPromotion.freeProductIds.includes(normalizedId)) {
        this.currentPromotion.freeProductIds = [...this.currentPromotion.freeProductIds, normalizedId];
      }
    } else {
      const normalizedId = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
      this.currentPromotion.freeProductIds = this.currentPromotion.freeProductIds.filter(p => {
        const normalizedP = typeof p === 'string' ? parseInt(String(p), 10) : Number(p);
        return normalizedP !== normalizedId;
      });
    }
    
    console.log('onFreeProductChange:', {
      productId,
      freeProductIds: this.currentPromotion.freeProductIds,
      checked: event.checked
    });
  }

  isFreeProductSelected(productId: number | undefined): boolean {
    if (!this.currentPromotion.freeProductIds) {
      this.currentPromotion.freeProductIds = [];
    }
    if (!productId && productId !== 0) {
      return false;
    }
    const normalizedProductId = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
    if (isNaN(normalizedProductId)) {
      return false;
    }
    return this.currentPromotion.freeProductIds.some(id => {
      const normalizedId = typeof id === 'string' ? parseInt(String(id), 10) : Number(id);
      return !isNaN(normalizedId) && normalizedId === normalizedProductId;
    });
  }

  togglePromotionStatus(promotion: Promotion) {
    if (!promotion.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede cambiar el estado de una promoción sin ID.'
      });
      return;
    }

    this.promotionToToggle = promotion;
    this.newStatus = !promotion.isActive;
    this.showConfirmStatusDialog = true;
  }

  confirmToggleStatus() {
    if (!this.promotionToToggle || !this.promotionToToggle.id) {
      return;
    }

    const promotionToUpdate: Promotion = {
      ...this.promotionToToggle,
      companiaId: this.companiaId,
      isActive: this.newStatus
    };

    this.loading = true;
    this.showConfirmStatusDialog = false;
    
    this.promotionsService.updatePromotion(promotionToUpdate).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.code === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Promoción ${this.newStatus ? 'activada' : 'desactivada'} correctamente.`
          });
          this.loadPromotions();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message
          });
        }
        this.promotionToToggle = null;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${this.newStatus ? 'activar' : 'desactivar'} la promoción.`
        });
        this.promotionToToggle = null;
      }
    });
  }

  cancelToggleStatus() {
    this.showConfirmStatusDialog = false;
    this.promotionToToggle = null;
  }
}