import Papa from 'papaparse';

export const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
export const parseCurrency = (value: string) => parseFloat(value.replace(/[^0-9]/g, '')) || 0;

export const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export interface ParsedCsvResult {
    data: any[];
    meta: any;
    errors: any[];
}

export const parseCSV = (file: File): Promise<ParsedCsvResult> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results as ParsedCsvResult),
            error: (error) => reject(error)
        });
    });
};