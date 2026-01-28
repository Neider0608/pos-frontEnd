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

    generate(invoiceData: any) {
        const { invoiceNumber, date, customer, items, subtotal, detailDiscount, generalDiscount, grossSubtotal, totalVat, total, paymentMethods, session } = invoiceData;

        const generalDiscountValue = ((grossSubtotal - detailDiscount) * (generalDiscount || 0)) / 100;

        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            defaultStyle: { fontSize: 9, color: '#2D3748' },
            content: [
                // ENCABEZADO EMPRESA
                {
                    columns: [
                        [
                            // Busca esta línea en el método generate() y reemplázala:
                            // ANTES: { text: session.compania.toUpperCase(), style: 'brand' },

                            // AHORA (Seguro):
                            {
                                text: (session?.compania || 'EMPRESA NO IDENTIFICADA').toUpperCase(),
                                style: 'brand'
                            },
                            {
                                text: session?.nit ? `NIT: ${session.nit}-${session.dv || ''}` : 'NIT: N/A',
                                style: 'sub'
                            },
                            { text: session.location, style: 'sub' }
                            /*  { text: 'Tel: ' + session.phone, style: 'sub' } */
                        ],
                        [
                            { text: 'FACTURA DE VENTA', alignment: 'right', style: 'h1' },
                            { text: `No. #FAV-${invoiceNumber}`, alignment: 'right', style: 'badge' },
                            { text: `Fecha: ${new Date(date).toLocaleDateString('es-CO')}`, alignment: 'right', style: 'small' }
                        ]
                    ]
                },

                { canvas: [{ type: 'line', x1: 0, y1: 15, x2: 515, y2: 15, lineWidth: 0.5, lineColor: '#E2E8F0' }] },

                // INFORMACIÓN DEL CLIENTE
                {
                    margin: [0, 25, 0, 15],
                    stack: [
                        { text: 'DATOS DEL CLIENTE', style: 'sectionHeader' },
                        {
                            columns: [
                                {
                                    stack: [
                                        { text: 'Nombre / Razón Social', style: 'label' },
                                        { text: customer ? (customer.isCompany ? customer.companyName : this.getFullName(customer)) : 'Cliente General', style: 'value' }
                                    ]
                                },
                                {
                                    stack: [
                                        { text: 'Documento / NIT', style: 'label' },
                                        { text: customer ? (customer.isCompany ? customer.nit : customer.document || '-') : '-', style: 'value' }
                                    ]
                                }
                            ]
                        }
                    ]
                },

                // TABLA DE PRODUCTOS
                {
                    margin: [0, 10, 0, 0],
                    table: {
                        widths: ['*', 40, 80, 50, 80],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'DESCRIPCIÓN', style: 'th' },
                                { text: 'CANT.', style: 'th', alignment: 'center' },
                                { text: 'PRECIO UNIT.', style: 'th', alignment: 'right' },
                                { text: 'DESC.', style: 'th', alignment: 'center' },
                                { text: 'TOTAL', style: 'th', alignment: 'right' }
                            ],
                            ...items.map((i: any) => [
                                {
                                    stack: [
                                        { text: i.name, bold: true },
                                        { text: `Ref: ${i.reference || 'N/A'}`, fontSize: 7, color: '#718096' }
                                    ],
                                    margin: [0, 5, 0, 5]
                                },
                                { text: i.quantity.toString(), alignment: 'center', margin: [0, 5, 0, 5] },
                                { text: this.currency(i.price), alignment: 'right', margin: [0, 5, 0, 5] },
                                { text: i.discount > 0 ? `${i.discount}%` : '-', alignment: 'center', margin: [0, 5, 0, 5] },
                                { text: this.currency(i.total), alignment: 'right', bold: true, margin: [0, 5, 0, 5] }
                            ])
                        ]
                    },
                    layout: {
                        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.1),
                        vLineWidth: () => 0,
                        hLineColor: (i: number) => (i === 0 || i === 1 ? '#2D3748' : '#E2E8F0'),
                        paddingTop: () => 8,
                        paddingBottom: () => 8
                    }
                },

                // RESUMEN Y TOTALES
                {
                    margin: [0, 20, 0, 0],
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { text: 'FORMAS DE PAGO', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                                ...(paymentMethods || []).map((p: any) => ({
                                    text: `${this.getPaymentLabel(p.type)}: ${this.currency(p.amount)}`,
                                    fontSize: 8,
                                    margin: [0, 2]
                                }))
                            ]
                        },
                        {
                            width: 180,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [
                                        { text: 'SUBTOTAL', style: 'summaryLabel' },
                                        { text: this.currency(grossSubtotal), style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'DESCUENTOS', style: 'summaryLabel' },
                                        { text: `- ${this.currency(detailDiscount + generalDiscountValue)}`, style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'IMPUESTOS (IVA)', style: 'summaryLabel' },
                                        { text: this.currency(totalVat || 0), style: 'summaryValue' }
                                    ],
                                    [
                                        { text: 'TOTAL A PAGAR', style: 'totalLabel' },
                                        { text: this.currency(total), style: 'totalValue' }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                },

                {
                    text: 'Gracias por su confianza. Esta es una representación gráfica de su factura.',
                    style: 'footer',
                    margin: [0, 40, 0, 0],
                    alignment: 'center'
                }
            ],
            styles: {
                brand: { fontSize: 13, bold: true, color: '#1A202C' },
                h1: { fontSize: 16, bold: true, color: '#2D3748', letterSpacing: 1 },
                sub: { fontSize: 8, color: '#718096', margin: [0, 1] },
                badge: { fontSize: 10, bold: true, color: '#3182CE', margin: [0, 5] },
                sectionHeader: { fontSize: 8, bold: true, color: '#718096', letterSpacing: 0.5, margin: [0, 0, 0, 8] },
                label: { fontSize: 7, color: '#A0AEC0', uppercase: true },
                value: { fontSize: 9, bold: true, margin: [0, 2, 0, 0] },
                th: { fontSize: 8, bold: true, color: '#2D3748', margin: [0, 5] },
                summaryLabel: { fontSize: 8, color: '#718096', margin: [0, 3] },
                summaryValue: { fontSize: 8, alignment: 'right', margin: [0, 3] },
                totalLabel: { fontSize: 10, bold: true, margin: [0, 5] },
                totalValue: { fontSize: 11, bold: true, alignment: 'right', color: '#1A202C', margin: [0, 5] },
                footer: { fontSize: 8, color: '#A0AEC0', italics: true }
            }
        };

        pdfMake.createPdf(docDefinition).download(`Factura_${invoiceNumber}.pdf`);
    }

    generatePOS(invoiceData: any) {
        const { invoiceNumber, date, customer, items, grossSubtotal, detailDiscount, generalDiscount, totalVat, subtotal, total, paymentMethods, session } = invoiceData;

        const generalDiscountValue = ((grossSubtotal - detailDiscount) * (generalDiscount || 0)) / 100;

        const docDefinition: any = {
            pageSize: { width: 80 * 2.83, height: 'auto' },
            pageMargins: [8, 10, 8, 10],
            defaultStyle: { fontSize: 8, color: '#000', lineHeight: 1.2 },
            content: [
                { text: session.compania.toUpperCase(), alignment: 'center', bold: true, fontSize: 10 },
                { text: `NIT: ${session.nit}-${session.dv}`, alignment: 'center', fontSize: 7 },
                { text: session.location, alignment: 'center', fontSize: 7 },
                /*  { text: 'Tel: ' + session.phone, alignment: 'center', fontSize: 7 },
                 */
                { text: '═'.repeat(30), alignment: 'center', margin: [0, 5] },

                { text: `FACTURA: #FAV-${invoiceNumber}`, alignment: 'center', bold: true },
                { text: new Date(date).toLocaleString('es-CO'), alignment: 'center', fontSize: 7 },

                { text: '─'.repeat(40), alignment: 'center', margin: [0, 5] },

                ...(customer
                    ? [
                          { text: 'CLIENTE', bold: true, fontSize: 7 },
                          { text: customer.isCompany ? customer.companyName : this.getFullName(customer), fontSize: 8 },
                          { text: `CC/NIT: ${customer.isCompany ? customer.nit : customer.document}`, fontSize: 8 },
                          { text: '─'.repeat(40), alignment: 'center', margin: [0, 5] }
                      ]
                    : []),

                // ITEMS
                ...items.map((i: any) => ({
                    margin: [0, 2],
                    stack: [
                        {
                            columns: [
                                { text: `${i.quantity} x ${i.name.substring(0, 20)}`, width: '*' },
                                { text: this.currency(i.total), width: 'auto', alignment: 'right', bold: true }
                            ]
                        },
                        { text: `Precio: ${this.currency(i.price)} ${i.discount > 0 ? '| Desc: ' + i.discount + '%' : ''}`, fontSize: 7, color: '#444' }
                    ]
                })),

                { text: '─'.repeat(40), alignment: 'center', margin: [0, 5] },

                // TOTALES POS
                {
                    columns: [
                        { text: 'SUBTOTAL', width: '*' },
                        { text: this.currency(grossSubtotal), alignment: 'right' }
                    ]
                },
                {
                    columns: [
                        { text: 'DESCUENTOS', width: '*' },
                        { text: `- ${this.currency(detailDiscount + generalDiscountValue)}`, alignment: 'right' }
                    ]
                },
                {
                    columns: [
                        { text: 'IVA', width: '*' },
                        { text: this.currency(totalVat || 0), alignment: 'right' }
                    ]
                },
                {
                    margin: [0, 4],
                    columns: [
                        { text: 'TOTAL A PAGAR', bold: true, fontSize: 10, width: '*' },
                        { text: this.currency(total), bold: true, fontSize: 10, alignment: 'right' }
                    ]
                },

                { text: '═'.repeat(30), alignment: 'center', margin: [0, 5] },

                { text: '¡GRACIAS POR SU COMPRA!', alignment: 'center', bold: true, fontSize: 7 },
                { text: 'Factura generada electrónicamente', alignment: 'center', fontSize: 6, color: '#666', margin: [0, 2] }
            ]
        };

        pdfMake.createPdf(docDefinition).open();
    }

    private getPaymentLabel(type: string): string {
        const labels: any = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', financed: 'Financiado', other: 'Otro' };
        return labels[type] || type;
    }

    getFullName(customer: any): string {
        return [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter((v) => !!v).join(' ');
    }
}
