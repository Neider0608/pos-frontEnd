import { Injectable } from '@angular/core';
import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';

const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

@Injectable({
    providedIn: 'root'
})
export class InvoicePdfService {
    private currency(v: number) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(v);
    }

    private calculateItemSubtotal(item: any): number {
        return (item.price || 0) * (item.quantity || 1);
    }

    private calculateItemDiscountValue(item: any): number {
        const subtotal = this.calculateItemSubtotal(item);
        return (item.discount || 0) > 0 ? subtotal * (item.discount / 100) : 0;
    }

    private calculateItemVatValue(item: any): number {
        if (item.vatValue && item.vatValue > 0) {
            return item.vatValue;
        }
        if (!item.appliesVAT || !item.vatRate || item.vatRate <= 0) {
            return 0;
        }
        const subtotal = this.calculateItemSubtotal(item);
        const discountValue = this.calculateItemDiscountValue(item);
        const afterDiscount = subtotal - discountValue;
        return afterDiscount * (item.vatRate / 100);
    }

    private calculateTotalVat(items: any[], providedTotalVat: number): number {
        if (providedTotalVat && providedTotalVat > 0) {
            return providedTotalVat;
        }
        let total = 0;
        items.forEach((item: any) => {
            if (item.vatValue && item.vatValue > 0) {
                total += item.vatValue;
            } else if (item.appliesVAT && item.vatRate > 0) {
                const subtotal = (item.price || 0) * (item.quantity || 1);
                const afterDiscount = subtotal - (item.discountValue || 0);
                const vatValue = afterDiscount * (item.vatRate / 100);
                total += vatValue;
            }
        });
        return total;
    }

    generate(invoiceData: any) {
        const { invoiceNumber, date, customer, items, subtotal, detailDiscount, generalDiscount, grossSubtotal, totalVat, total, paymentMethods, session } = invoiceData;

        const generalDiscountValue = ((grossSubtotal - detailDiscount) * (generalDiscount || 0)) / 100;
        const calculatedTotalVat = this.calculateTotalVat(items, totalVat);

        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [35, 30, 35, 40],
            defaultStyle: { fontSize: 9, color: '#374151' },
            content: [
                {
                    columns: [
                        {
                            width: 200,
                            stack: [
                                {
                                    text: (session?.compania || 'MI EMPRESA').toUpperCase(),
                                    style: 'brand',
                                    margin: [0, 0, 0, 5]
                                },
                                { text: session?.location || 'Dirección', style: 'sub' },
                                { text: session?.nit ? `NIT: ${session.nit}-${session.dv || '0'}` : '', style: 'sub' },
                                { text: session?.phone ? `Tel: ${session.phone}` : '', style: 'sub' }
                            ]
                        },
                        {
                            width: '*',
                            stack: [
                                {
                                    text: 'FACTURA ELECTRÓNICA',
                                    alignment: 'right',
                                    style: 'title',
                                    margin: [0, 0, 0, 5]
                                },
                                {
                                    text: `N° ${invoiceNumber}`,
                                    alignment: 'right',
                                    style: 'invoiceNumber',
                                    margin: [0, 0, 0, 3]
                                },
                                {
                                    text: `Fecha: ${new Date(date).toLocaleDateString('es-CO')}`,
                                    alignment: 'right',
                                    style: 'sub',
                                    margin: [0, 0, 0, 2]
                                },
                                {
                                    text: `Hora: ${new Date(date).toLocaleTimeString('es-CO')}`,
                                    alignment: 'right',
                                    style: 'sub'
                                }
                            ]
                        }
                    ]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 520, y2: 5, lineWidth: 1, lineColor: '#10B981' }] },
                {
                    margin: [0, 15, 0, 0],
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'CLIENTE', style: 'sectionTitle' },
                                {
                                    margin: [0, 5, 0, 0],
                                    stack: [
                                        { text: 'Nombre:', style: 'label' },
                                        { text: customer ? (customer.isCompany ? customer.businessName : this.getFullName(customer)) : 'Consumidor Final', style: 'value' }
                                    ]
                                },
                                {
                                    margin: [0, 5, 0, 0],
                                    stack: [
                                        { text: 'Documento:', style: 'label' },
                                        { text: customer ? (customer.isCompany ? customer.nit || '-' : customer.document || '-') : '-', style: 'value' }
                                    ]
                                },
                                {
                                    margin: [0, 5, 0, 0],
                                    stack: [
                                        { text: 'Email:', style: 'label' },
                                        { text: customer?.email || '-', style: 'value' }
                                    ]
                                }
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'FORMA DE PAGO', style: 'sectionTitle' },
                                {
                                    margin: [0, 5, 0, 0],
                                    stack: (paymentMethods || []).map((p: any) => ({
                                        text: `${this.getPaymentLabel(p.type)}: ${this.currency(p.amount)}`,
                                        style: 'value',
                                        margin: [0, 3, 0, 0]
                                    }))
                                }
                            ]
                        }
                    ]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 520, y2: 10, lineWidth: 0.5, lineColor: '#E5E7EB' }] },
                {
                    margin: [0, 15, 0, 0],
                    table: {
                        widths: ['*', 35, 60, 50, 55, 60, 65],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'DESCRIPCIÓN', style: 'th' },
                                { text: 'CANT.', style: 'th', alignment: 'center' },
                                { text: 'PRECIO', style: 'th', alignment: 'right' },
                                { text: 'IVA $', style: 'th', alignment: 'right' },
                                { text: 'DCTO $', style: 'th', alignment: 'right' },
                                { text: 'SUBTOTAL', style: 'th', alignment: 'right' },
                                { text: 'TOTAL', style: 'th', alignment: 'right' }
                            ],
                            ...items.map((i: any) => {
                                const itemSubtotal = this.calculateItemSubtotal(i);
                                const itemDiscountValue = this.calculateItemDiscountValue(i);
                                const itemVatValue = this.calculateItemVatValue(i);
                                return [
                                    {
                                        stack: [
                                            { text: i.name, bold: true, fontSize: 9 },
                                            { text: `Ref: ${i.reference || 'N/A'}`, fontSize: 7, color: '#9CA3AF' }
                                        ],
                                        margin: [0, 4, 0, 4]
                                    },
                                    { text: i.quantity.toString(), alignment: 'center', margin: [0, 4, 0, 4] },
                                    { text: this.currency(i.price), alignment: 'right', margin: [0, 4, 0, 4], fontSize: 8 },
                                    { text: this.currency(itemVatValue), alignment: 'right', margin: [0, 4, 0, 4], fontSize: 8 },
                                    { text: itemDiscountValue > 0 ? `- ${this.currency(itemDiscountValue)}` : this.currency(0), alignment: 'right', margin: [0, 4, 0, 4], fontSize: 8, color: itemDiscountValue > 0 ? '#DC2626' : undefined },
                                    { text: this.currency(itemSubtotal), alignment: 'right', margin: [0, 4, 0, 4], fontSize: 8 },
                                    { text: this.currency(i.total), alignment: 'right', bold: true, margin: [0, 4, 0, 4] }
                                ];
                            })
                        ]
                    },
                    layout: {
                        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
                        vLineWidth: () => 0,
                        hLineColor: (i: number) => (i === 0 || i === 1 ? '#10B981' : '#E5E7EB'),
                        paddingTop: () => 6,
                        paddingBottom: () => 6
                    }
                },
                {
                    margin: [0, 20, 0, 0],
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 200,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [
                                        { text: 'Subtotal', style: 'summaryLabel' },
                                        { text: this.currency(grossSubtotal), style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'Base Gravable', style: 'summaryLabel' },
                                        { text: this.currency(subtotal), style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'IVA', style: 'summaryLabel' },
                                        { text: this.currency(calculatedTotalVat), style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'Descuentos', style: 'summaryLabel', color: '#DC2626' },
                                        { text: detailDiscount + generalDiscountValue > 0 ? `- ${this.currency(detailDiscount + generalDiscountValue)}` : this.currency(0), style: 'summaryValue', color: '#DC2626' }
                                    ],
                                    [
                                        { text: 'TOTAL PAGADO', style: 'totalLabel' },
                                        { text: this.currency(total), style: 'totalValue' }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                },
                {
                    margin: [0, 40, 0, 0],
                    columns: [
                        {
                            width: '*',
                            stack: [
                                {
                                    canvas: [
                                        {
                                            type: 'rect',
                                            x: 0,
                                            y: 0,
                                            w: 520,
                                            h: 50,
                                            lineWidth: 1,
                                            lineColor: '#E5E7EB'
                                        }
                                    ]
                                },
                                {
                                    text: 'Gracias por su compra. Esta es una representación gráfica de la factura electrónica de venta.',
                                    alignment: 'center',
                                    fontSize: 8,
                                    color: '#6B7280',
                                    margin: [0, 10, 0, 0]
                                }
                            ]
                        }
                    ]
                }
            ],
            styles: {
                brand: { fontSize: 16, bold: true, color: '#1F2937' },
                title: { fontSize: 14, bold: true, color: '#10B981', letterSpacing: 1 },
                invoiceNumber: { fontSize: 12, bold: true, color: '#374151' },
                sub: { fontSize: 8, color: '#6B7280', margin: [0, 1] },
                sectionTitle: { fontSize: 9, bold: true, color: '#10B981', letterSpacing: 0.5, margin: [0, 0, 0, 5] },
                label: { fontSize: 7, color: '#9CA3AF', uppercase: true },
                value: { fontSize: 9, bold: true, margin: [0, 2, 0, 0] },
                th: { fontSize: 8, bold: true, color: '#FFFFFF', margin: [0, 6], fillColor: '#374151' },
                summaryLabel: { fontSize: 9, color: '#6B7280', margin: [0, 4] },
                summaryValue: { fontSize: 9, alignment: 'right', margin: [0, 4] },
                totalLabel: { fontSize: 11, bold: true, color: '#1F2937', margin: [0, 6] },
                totalValue: { fontSize: 11, bold: true, alignment: 'right', color: '#10B981', margin: [0, 6] }
            }
        };

        pdfMake.createPdf(docDefinition).download(`Factura_${invoiceNumber}.pdf`);
    }

    generatePOS(invoiceData: any) {
        const { invoiceNumber, date, customer, items, grossSubtotal, detailDiscount, generalDiscount, totalVat, subtotal, total, paymentMethods, session } = invoiceData;

        const generalDiscountValue = ((grossSubtotal - detailDiscount) * (generalDiscount || 0)) / 100;
        const calculatedTotalVat = this.calculateTotalVat(items, totalVat);

        const pageWidth = 190;

        const truncate = (text: string, len: number) => {
            return text.length > len ? text.substring(0, len - 2) + '..' : text;
        };

        const line = '─'.repeat(40);
        const separator = '═'.repeat(20);

        const content: any[] = [
            { text: session?.compania?.toUpperCase() || 'MI TIENDA', alignment: 'center', bold: true, fontSize: 10 },
            { text: session?.nit ? `NIT: ${session.nit}-${session.dv || '0'}` : 'NIT: N/A', alignment: 'center', fontSize: 7 },
            { text: session?.location || '', alignment: 'center', fontSize: 7 },
            { text: separator, alignment: 'center', margin: [0, 4] },
            { text: `Factura N° ${invoiceNumber}`, alignment: 'center', bold: true, fontSize: 9 },
            { text: new Date(date).toLocaleString('es-CO'), alignment: 'center', fontSize: 7 },
            { text: line, alignment: 'center', margin: [0, 3] }
        ];

        if (customer) {
            content.push(
                { text: 'CLIENTE:', bold: true, fontSize: 7 },
                { text: customer.isCompany ? customer.businessName : this.getFullName(customer), fontSize: 8 },
                { text: customer.isCompany ? `NIT: ${customer.nit}` : `CC: ${customer.document}`, fontSize: 7 },
                { text: line, alignment: 'center', margin: [0, 3] }
            );
        }

        items.forEach((i: any) => {
            const name = truncate(i.name || 'Producto', 25);
            const itemSubtotal = this.calculateItemSubtotal(i);
            content.push({
                columns: [
                    { text: `${i.quantity}x`, width: 20, fontSize: 8, bold: true },
                    { text: name, width: '*', fontSize: 8 },
                    { text: this.currency(i.total), width: 65, alignment: 'right', fontSize: 8, bold: true }
                ],
                margin: [0, 2]
            });
            let detailLine = `${this.currency(i.price)}`;
            if (i.appliesVAT && i.vatRate > 0) {
                detailLine += ` +IVA ${this.currency(i.vatValue || 0)}`;
            }
            if (i.discount > 0) {
                const dctoValue = itemSubtotal * (i.discount / 100);
                detailLine += ` -Dcto ${this.currency(dctoValue)}`;
            }
            content.push({ text: detailLine, fontSize: 6, color: '#666', margin: [20, 0, 0, 0] });
        });

        content.push(
            { text: line, alignment: 'center', margin: [0, 4] },
            {
                columns: [
                    { text: 'Subtotal:', width: '*', fontSize: 8 },
                    { text: this.currency(grossSubtotal), alignment: 'right', fontSize: 8 }
                ],
                margin: [0, 1]
            }
        );

        if (calculatedTotalVat > 0) {
            content.push({
                columns: [
                    { text: 'Impuestos:', width: '*', fontSize: 8 },
                    { text: this.currency(calculatedTotalVat), alignment: 'right', fontSize: 8 }
                ],
                margin: [0, 1]
            });
        }

        if (detailDiscount + generalDiscountValue > 0) {
            content.push({
                columns: [
                    { text: 'Descuentos:', width: '*', fontSize: 8, color: '#DC2626' },
                    { text: `- ${this.currency(detailDiscount + generalDiscountValue)}`, alignment: 'right', fontSize: 8, color: '#DC2626' }
                ],
                margin: [0, 1]
            });
        }

        content.push(
            { text: line, alignment: 'center', margin: [0, 3] },
            {
                columns: [
                    { text: 'TOTAL:', width: '*', fontSize: 10, bold: true },
                    { text: this.currency(total), alignment: 'right', fontSize: 10, bold: true }
                ],
                margin: [0, 2]
            }
        );

        if (paymentMethods && paymentMethods.length > 0) {
            content.push({ text: line, alignment: 'center', margin: [0, 4] }, { text: 'PAGOS:', bold: true, fontSize: 7 });
            paymentMethods.forEach((p: any) => {
                content.push({
                    columns: [
                        { text: this.getPaymentLabel(p.type) + ':', width: '*', fontSize: 7 },
                        { text: this.currency(p.amount), alignment: 'right', fontSize: 7 }
                    ],
                    margin: [0, 1]
                });
            });
        }

        content.push(
            { text: separator, alignment: 'center', margin: [0, 6] },
            { text: '¡GRACIAS POR SU COMPRA!', alignment: 'center', bold: true, fontSize: 8 },
            { text: 'Factura electrónica de venta', alignment: 'center', fontSize: 6, color: '#666', margin: [0, 2] }
        );

        const docDefinition: any = {
            pageSize: { width: pageWidth, height: 'auto' },
            pageMargins: [5, 10, 5, 10],
            defaultStyle: { fontSize: 8, color: '#000' },
            content: content
        };

        pdfMake.createPdf(docDefinition).open();
    }

    private getPaymentLabel(type: string): string {
        const labels: any = {
            cash: 'Efectivo',
            card: 'Tarjeta',
            transfer: 'Transferencia',
            financed: 'Financiado',
            other: 'Otro'
        };
        return labels[type] || type;
    }

    getFullName(customer: any): string {
        return [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter((v) => !!v).join(' ');
    }
}
