export const convertMarathiToEnglishNumbers = (input) => {
    if (input === null || input === undefined) return '';
    const marathiDigits = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    };
    return String(input)
      .replace(/[०-९]/g, match => marathiDigits[match])
      .replace(/[^0-9.]/g, ''); 
};

export const calculateItemAmount = (item, companyDetails = null) => {
    let companyCustomRate = null;
    
    if (item.workMain === 'Others') {
        companyCustomRate = item.customRate;
    } else {
        let workRates = companyDetails?.work_rates;
        if (typeof workRates === 'string') {
            try { workRates = JSON.parse(workRates); } catch (e) { workRates = {}; }
        }

        if (workRates && item.workMain) {
            if (item.workMain === '32_GB_Pendrive') {
                companyCustomRate = workRates[item.workMain];
            } else {
                const categoryRates = workRates[item.workMain];
                if (categoryRates && item.workSub) {
                    if (categoryRates[item.workSub] !== undefined) {
                        companyCustomRate = categoryRates[item.workSub];
                    } else {
                        const normalize = (str) => (str || '').toLowerCase().replace(/[_ ]/g, '');
                        const normalizedTarget = normalize(item.workSub);
                        const matchedKey = Object.keys(categoryRates).find(k => normalize(k) === normalizedTarget);
                        if (matchedKey) companyCustomRate = categoryRates[matchedKey];
                    }
                }
            }
        }
    }
    
    const finalRate = (companyCustomRate !== undefined && companyCustomRate !== '' && companyCustomRate !== null) 
                        ? Number(companyCustomRate) 
                        : 0;

    const quantity = Number(item.quantity) || 1;

    const bannerSubs = [
        "डिजिटल फ्लेक्स बॅनर डिझाईन करणे. (प्रती चो. फुट)",
        "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग सहित (प्रती चो. फुट)",
        "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग/लकडी फ्रेम तयार करणे"
    ];

    if (item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' || bannerSubs.includes(item.workSub)) {
        let totalArea = 0;
        if (item.dimensions && Array.isArray(item.dimensions) && item.dimensions.length > 0) {
            item.dimensions.forEach(dim => {
                const l = Number(dim.length) || 0;
                const b = Number(dim.breadth) || 0;
                const q = Number(dim.qty) || 1;
                totalArea += (l * b * q);
            });
        } else {
            const l = Number(item.length) || 0;
            const b = Number(item.breadth) || 0;
            totalArea = l * b * quantity;
        }
        return totalArea * finalRate;
    }

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
export function numberToMarathiWords(num) {
    if (num === 0) return 'शून्य';
    const a = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
    const b = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
    const tensArray = ['दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस', 'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस', 'एकतीस', 'बत्तीस', 'तेहतीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस', 'एकेचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'शेहेचाळीस', 'सत्तेचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास', 'एकावन्न', 'बावन्न', 'त्रेपन्न', 'चोपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ', 'एकसष्ट', 'बासष्ट', 'त्रेसष्ट', 'चौसष्ट', 'पासष्ट', 'सहासष्ट', 'सदुसष्ट', 'अडुसष्ट', 'एकोणसत्तर', 'सत्तर', 'एकाहत्तर', 'बाहत्तर', 'त्र्याहत्तर', 'चौर्‍याहत्तर', 'पंच्याहत्तर', 'शहात्तर', 'सत्ताहत्तर', 'अठ्ठ्याहत्तर', 'एकोणऐंशी', 'ऐंशी', 'एक्क्याऐंशी', 'ब्याऐंशी', 'त्र्याऐंशी', 'चौर्‍याऐंशी', 'पंच्याऐंशी', 'शहाऐंशी', 'सत्त्याऐंशी', 'अठ्ठ्याऐंशी', 'एकोणनव्वद', 'नव्वद', 'एक्क्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौऱ्याण्णव', 'पंच्याण्णव', 'शहाण्णव', 'सत्त्याण्णव', 'अठ्ठ्याण्णव', 'नव्याण्णव'];

    if ((num = Math.round(num).toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    
    str += (n[1] !== '00') ? (tensArray[Number(n[1]) - 10] || a[Number(n[1])]) + ' कोटी ' : '';
    str += (n[2] !== '00') ? (tensArray[Number(n[2]) - 10] || a[Number(n[2])]) + ' लाख ' : '';
    str += (n[3] !== '00') ? (tensArray[Number(n[3]) - 10] || a[Number(n[3])]) + ' हजार ' : '';
    str += (n[4] !== '0') ? a[Number(n[4])] + 'शे ' : '';
    str += (n[5] !== '00') ? (tensArray[Number(n[5]) - 10] || a[Number(n[5])]) : '';
    
    str = str.replace(/एकशे /g, 'शंभर ');
    
    return str.trim();
}
