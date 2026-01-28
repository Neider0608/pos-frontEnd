export interface CashRegister {
    id: string
    name: string
    status: "open" | "closed"
    openedAt: string
    closedAt?: string
    openingBalance: number
    expectedBalance: number
    actualBalance?: number
    difference?: number
    operator: string
  }