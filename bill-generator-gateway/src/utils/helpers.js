export const calculateItemAmount = (item, companyDetails = null) => {
    let companyCustomRate = null;
    
    // Check if the user manually entered a rate for "Others"
    if (item.workMain === 'Others') {
        companyCustomRate = item.customRate;
    } else {
        // 1. Safely handle if Supabase returns work_rates as a JSON string instead of an object
        let workRates = companyDetails?.work_rates;
        if (typeof workRates === 'string') {
            try { workRates = JSON.parse(workRates); } catch (e) { workRates = {}; }
        }

        // 2. Navigate the nested object to find the rate
        if (workRates && item.workMain) {
            if (item.workMain === '32_GB_Pendrive') {
                companyCustomRate = workRates[item.workMain];
            } else {
                const categoryRates = workRates[item.workMain];
                
                if (categoryRates && item.workSub) {
                    // Try an exact match first
                    if (categoryRates[item.workSub] !== undefined) {
                        companyCustomRate = categoryRates[item.workSub];
                    } else {
                        // FUZZY MATCH: If spaces/underscores don't align perfectly, strip them out
                        const normalize = (str) => (str || '').toLowerCase().replace(/[_ ]/g, '');
                        const normalizedTarget = normalize(item.workSub);
                        
                        const matchedKey = Object.keys(categoryRates).find(k => normalize(k) === normalizedTarget);
                        
                        if (matchedKey) {
                            companyCustomRate = categoryRates[matchedKey];
                        }
                    }
                }
            }
        }
    }
    
    // 3. Fall back to 0 if the rate is completely empty or missing
    const finalRate = (companyCustomRate !== undefined && companyCustomRate !== '' && companyCustomRate !== null) 
                        ? Number(companyCustomRate) 
                        : 0;

    // 4. Calculate total
    const quantity = item.quantity || 1;
    return finalRate * quantity;
};

export function numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = Math.round(num).toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
}

export const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};