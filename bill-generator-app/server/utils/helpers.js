/**
 * Item amount calculation mirrored from gateway helpers
 * to allow server-side financial aggregations without client roundtrips.
 */
function calculateItemAmount(item, companyDetails = null) {
  if (!item) return 0;

  let companyCustomRate = null;

  if (item.workMain === 'Others') {
    companyCustomRate = item.customRate;
  } else {
    let workRates = companyDetails?.work_rates;
    if (typeof workRates === 'string') {
      try {
        workRates = JSON.parse(workRates);
      } catch (e) {
        workRates = {};
      }
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
            const matchedKey = Object.keys(categoryRates).find(
              (k) => normalize(k) === normalizedTarget
            );
            if (matchedKey) companyCustomRate = categoryRates[matchedKey];
          }
        }
      }
    }
  }

  const finalRate =
    companyCustomRate !== undefined &&
    companyCustomRate !== '' &&
    companyCustomRate !== null
      ? Number(companyCustomRate)
      : 0;

  const quantity = Number(item.quantity) || 1;

  const bannerSubs = [
    "डिजिटल फ्लेक्स बॅनर डिझाईन करणे. (प्रती चो. फुट)",
    "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग सहित (प्रती चो. फुट)",
    "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग/लकडी फ्रेम तयार करणे"
  ];

  if (
    item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' ||
    bannerSubs.includes(item.workSub)
  ) {
    let totalArea = 0;
    if (item.dimensions && Array.isArray(item.dimensions) && item.dimensions.length > 0) {
      item.dimensions.forEach((dim) => {
        const l = Number(dim.length) || 0;
        const b = Number(dim.breadth) || 0;
        const q = Number(dim.qty) || 1;
        totalArea += l * b * q;
      });
    } else {
      const l = Number(item.length) || 0;
      const b = Number(item.breadth) || 0;
      totalArea = l * b * quantity;
    }
    return totalArea * finalRate;
  }

  return finalRate * quantity;
}

module.exports = {
  calculateItemAmount
};
