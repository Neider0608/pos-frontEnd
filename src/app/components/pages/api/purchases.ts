// src/app/models/purchase.model.ts

/**
 * Interfaz que define la estructura de un item (producto) dentro de una compra.
 */
export interface PurchaseItem {
    id: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    notes?: string; // Opcional: notas adicionales para el item
  }
  
  /**
   * Interfaz que define la estructura de la cabecera de una compra.
   */
  export interface PurchaseHeader {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    supplierName: string;
    purchaseDate: string; // Formato YYYY-MM-DD
    dueDate?: string; // Opcional: fecha de vencimiento, formato YYYY-MM-DD
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: "draft" | "pending" | "received" | "cancelled"; // Estados posibles de la compra
    notes?: string; // Opcional: notas generales de la compra
    createdAt: string; // Fecha y hora de creación de la compra
    createdBy: string; // Usuario que creó la compra
  }
  
  /**
   * Interfaz principal que combina la cabecera y los items para formar una compra completa.
   */
  export interface Purchase {
    header: PurchaseHeader;
    items: PurchaseItem[];
  }
  
  /**
   * Interfaz para los proveedores, usada en el Dropdown.
   */
  export interface Supplier {
    id: string;
    name: string;
  }
  
  