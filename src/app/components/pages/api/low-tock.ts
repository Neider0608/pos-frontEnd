export interface LowStockItem {
    id: string
    name: string
    barcode: string
    category: string
    currentStock: number
    minStock: number
    maxStock: number
    stockPercentage: number
    lastSale: string
    avgDailySales: number
    daysUntilEmpty: number
    supplier: string
    cost: number
    price: number
    status: "critical" | "low" | "warning"
  }
  
  export interface StockAlert {
    id: string
    productId: string
    productName: string
    alertType: "critical" | "low" | "out_of_stock"
    currentStock: number
    minStock: number
    createdAt: string
    isRead: boolean
  }
  