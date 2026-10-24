import JSZip from 'jszip';
import {
  calculateItemAmount,
  numberToWords,
  numberToMarathiWords,
  convertEnglishToMarathiNumbers,
  formatEventDateDisplay,
  getOrderDateRange
} from './helpers';
import { bannerSubs } from '../constants/data';

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const toAsciiHtmlEntities = (str) =>
  str.replace(/[^\x00-\x7F]/g, (ch) => `&#${ch.charCodeAt(0)};`);

const chunkBase64 = (b64, lineLength = 76) => {
  const chunks = [];
  for (let i = 0; i < b64.length; i += lineLength) {
    chunks.push(b64.slice(i, i + lineLength));
  }
  return chunks.join('\r\n');
};

export const loadImageAsMimePart = async (srcUrl, index, { targetHeightPx = 90, maxWidthPx = 260 } = {}) => {
  try {
    const encodedUrl = encodeURI(srcUrl);
    const response = await fetch(encodedUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const base64Data = String(dataUrl).split(',')[1] || '';
    if (!base64Data) return null;

    const dims = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 120, h: img.naturalHeight || 90 });
      img.onerror = () => resolve({ w: 120, h: 90 });
      img.src = dataUrl;
    });

    let height = targetHeightPx;
    let width = Math.round((dims.w * height) / Math.max(1, dims.h));
    if (maxWidthPx && width > maxWidthPx) {
      width = maxWidthPx;
      height = Math.round((dims.h * width) / Math.max(1, dims.w));
    }

    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const contentLocation = `file:///C:/InvoiceDoc/image_${index}.${ext}`;

    return {
      contentLocation,
      mimeType,
      base64Data,
      width,
      height
    };
  } catch (err) {
    console.warn('Could not load image for Word export:', srcUrl, err);
    return null;
  }
};

export const downloadMhtmlWordDoc = async (bodyHtml, mimeImages = [], filename = 'Invoice.docx', title = 'Invoice') => {
  const boundary = '----=_NextPart_BillGenerator_WordDoc';
  const fullHtml = [
    '<html xmlns:v="urn:schemas-microsoft-com:vml"',
    '      xmlns:o="urn:schemas-microsoft-com:office:office"',
    '      xmlns:w="urn:schemas-microsoft-com:office:word"',
    '      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"',
    '      xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    '<meta name="ProgId" content="Word.Document">',
    '<meta name="Generator" content="Microsoft Word 15">',
    '<meta name="Originator" content="Microsoft Word 15">',
    `<title>${escapeHtml(title)}</title>`,
    '<!--[if gte mso 9]><xml>',
    ' <w:WordDocument>',
    '  <w:View>Print</w:View>',
    '  <w:Zoom>100</w:Zoom>',
    '  <w:DoNotOptimizeForBrowser/>',
    ' </w:WordDocument>',
    '</xml><![endif]-->',
    '<style>',
    '  @page {',
    '    size: 595.3pt 841.9pt;',
    '    margin: 22.0pt 26.0pt 22.0pt 26.0pt;',
    '    mso-header-margin: 0pt;',
    '    mso-footer-margin: 0pt;',
    '    border: 1.5pt solid #000000;',
    '    mso-border-top-alt: solid black 1.5pt;',
    '    mso-border-bottom-alt: solid black 1.5pt;',
    '    mso-border-left-alt: solid black 1.5pt;',
    '    mso-border-right-alt: solid black 1.5pt;',
    '    mso-page-border-surround-header: yes;',
    '    mso-page-border-surround-footer: yes;',
    '    mso-page-border-offset-from: page;',
    '    mso-page-border-top-distance: 14.0pt;',
    '    mso-page-border-left-distance: 16.0pt;',
    '    mso-page-border-bottom-distance: 14.0pt;',
    '    mso-page-border-right-distance: 16.0pt;',
    '  }',
    '  @page WordSection1 {',
    '    size: 595.3pt 841.9pt;',
    '    margin: 22.0pt 26.0pt 22.0pt 26.0pt;',
    '    mso-header-margin: 0pt;',
    '    mso-footer-margin: 0pt;',
    '    border: 1.5pt solid #000000;',
    '    mso-border-top-alt: solid black 1.5pt;',
    '    mso-border-bottom-alt: solid black 1.5pt;',
    '    mso-border-left-alt: solid black 1.5pt;',
    '    mso-border-right-alt: solid black 1.5pt;',
    '    mso-page-border-surround-header: yes;',
    '    mso-page-border-surround-footer: yes;',
    '    mso-page-border-offset-from: page;',
    '    mso-page-border-top-distance: 14.0pt;',
    '    mso-page-border-left-distance: 16.0pt;',
    '    mso-page-border-bottom-distance: 14.0pt;',
    '    mso-page-border-right-distance: 16.0pt;',
    '  }',
    '  div.WordSection1 { page: WordSection1; }',
    '  body {',
    '    font-family: Arial, sans-serif;',
    '    color: #000000;',
    '    background-color: #ffffff;',
    '    margin: 0;',
    '    padding: 0;',
    '  }',
    '  table {',
    '    border-collapse: collapse;',
    '    mso-table-lspace: 0pt;',
    '    mso-table-rspace: 0pt;',
    '  }',
    '  p, div {',
    '    margin: 0;',
    '    padding: 0;',
    '  }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="WordSection1">',
    bodyHtml,
    '</div>',
    '</body>',
    '</html>'
  ].join('\r\n');

  const asciiHtml = toAsciiHtmlEntities(fullHtml);

  const mhtmlParts = [
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Location: file:///C:/InvoiceDoc/document.htm',
    'Content-Transfer-Encoding: 7bit',
    'Content-Type: text/html; charset="utf-8"',
    '',
    asciiHtml
  ];

  for (const img of mimeImages) {
    if (!img) continue;
    mhtmlParts.push(
      `--${boundary}`,
      `Content-Location: ${img.contentLocation}`,
      'Content-Transfer-Encoding: base64',
      `Content-Type: ${img.mimeType}`,
      '',
      chunkBase64(img.base64Data)
    );
  }

  mhtmlParts.push(`--${boundary}--`, '');

  const mhtmlContent = mhtmlParts.join('\r\n');

  // Package as a native OpenXML .docx archive with altChunk to guarantee Print Layout on save:
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="mht" ContentType="message/rfc822"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXmlRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rChunk1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.mht"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:view w:val="print"/>
  <w:zoom w:percent="100"/>
  <w:doNotShredHTML/>
</w:settings>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="rChunk1"/>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="440" w:right="520" w:bottom="440" w:left="520" w:header="0" w:footer="0" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.folder('word').file('document.xml', documentXml);
  zip.folder('word').file('settings.xml', settingsXml);
  zip.folder('word').folder('_rels').file('document.xml.rels', documentXmlRels);
  zip.folder('word').file('afchunk.mht', mhtmlContent);

  const docxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  const url = URL.createObjectURL(docxBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : filename.replace(/\.doc$/, '.docx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getItemDimensionsText = (item, quantity) => {
  if (item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' || bannerSubs.includes(item.workSub)) {
    const isLamination = item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच';
    const unit = isLamination ? 'इंच' : 'फूट';
    const sqUnit = isLamination ? 'sq.in' : 'sq.ft';

    if (item.dimensions && item.dimensions.length > 0) {
      let totalArea = 0;
      const dimsStr = item.dimensions
        .map((d) => {
          const l = Number(d.length) || 0;
          const b = Number(d.breadth) || 0;
          const q = Number(d.qty) || 1;
          totalArea += l * b * q;
          return `${l}x${b} (${q} नग)`;
        })
        .join(', ');
      return ` (आकार: ${dimsStr} ${unit} = ${totalArea} ${sqUnit})`;
    } else if (item.length && item.breadth) {
      return ` (आकार: ${item.length} x ${item.breadth} ${unit} = ${item.length * item.breadth * quantity} ${sqUnit})`;
    }
  }
  return '';
};

const getItemRate = (item, companyDetails) => {
  let companyCustomRate = null;
  if (companyDetails?.work_rates) {
    if (item.workMain === '32_GB_Pendrive' || item.workMain === 'Others') {
      companyCustomRate = companyDetails.work_rates[item.workMain];
    } else {
      companyCustomRate = companyDetails.work_rates[item.workMain]?.[item.workSub];
    }
  }
  return companyCustomRate !== undefined && companyCustomRate !== '' && companyCustomRate !== null
    ? Number(companyCustomRate)
    : 0;
};

export const exportWorkOrderToWord = async ({
  invoicePages,
  selectedItems,
  companyDetails,
  parentOrder,
  invoiceNumber,
  invoiceDate,
  isPO,
  poNumber,
  isVidhanMandal,
  totalAmount,
  totalWithGst,
  roundedTotal,
  uniqueDates
}) => {
  const ongcLogo = await loadImageAsMimePart('/ONGC logo.png', 1, { targetHeightPx: 88, maxWidthPx: 140 });
  const mimeImages = [ongcLogo].filter(Boolean);

  const buildWordSafePages = (items) => {
    if (!items || items.length === 0) return [[]];
    if (items.length <= 4) return [items];
    const pages = [items.slice(0, 6)];
    let rem = items.slice(6);
    while (rem.length > 0) {
      if (rem.length <= 8) {
        pages.push(rem);
        rem = [];
      } else {
        const chunk = Math.min(12, rem.length - 1);
        pages.push(rem.slice(0, chunk));
        rem = rem.slice(chunk);
      }
    }
    return pages;
  };

  const effectivePages =
    Array.isArray(invoicePages) && invoicePages.length > 0
      ? invoicePages
      : buildWordSafePages(selectedItems);
  const totalPages = effectivePages.length;

  const sameEventAndVenue =
    selectedItems.length > 0 &&
    selectedItems.every(
      (item) =>
        item.eventName === selectedItems[0].eventName &&
        item.eventVenue === selectedItems[0].eventVenue &&
        item.customVenue === selectedItems[0].customVenue
    );

  const eventSummaryText = sameEventAndVenue
    ? isVidhanMandal
      ? `कामाचे नांव ${selectedItems[0].eventName} कामाचे स्थळ ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}`
      : `For ${selectedItems[0].eventName} at ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}`
    : isVidhanMandal
      ? 'विविध ठिकाणी विविध कार्यक्रमांसाठी.'
      : 'For Various events at various places.';

  const pagesHtml = effectivePages
    .map((pageItems, pageIdx) => {
      const isFirstPage = pageIdx === 0;
      const isLastPage = pageIdx === totalPages - 1;

      const headerBlockHtml = isFirstPage
        ? `
          <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; margin-bottom:6pt;">
            <tr style="page-break-inside:avoid;">
              <td align="center" style="border:none; border-bottom:1pt solid #000000; padding:4pt 8pt 6pt 8pt; text-align:center;">
                ${
                  ongcLogo
                    ? `<div align="center" style="text-align:center; margin-bottom:4pt;"><img src="${ongcLogo.contentLocation}" width="${ongcLogo.width}" height="${ongcLogo.height}" alt="ONGC Logo" style="width:${ongcLogo.width}px; height:${ongcLogo.height}px;" /></div>`
                    : ''
                }
                <p style="margin:0; padding:0; margin-top:0pt; margin-bottom:0pt; mso-para-margin-top:0pt; mso-para-margin-bottom:0pt; line-height:13pt; mso-line-height-rule:exactly; font-family:Mangal, Arial, sans-serif; text-align:center;">
                  <span style="font-weight:bold; font-size:11pt;">निगमित संचार विभाग</span><br/>
                  <span style="font-size:9.5pt;">पहिली मंजिल, एनबीपी ग्रीन हाईट्स,</span><br/>
                  <span style="font-size:9.5pt;">क्षेत्रीय कार्यालय, ओएनजीसी बांद्रा कुर्ला कॉम्प्लेक्स</span><br/>
                  <span style="font-size:9.5pt;">बांद्रा (ईस्ट) , मुंबई - ४०००५१</span><br/>
                  <span style="font-size:9.5pt;">दूरभाष: 022-26274105 /4134 &nbsp;email : ongcmumbaice@ongc.co.in</span>
                </p>
              </td>
            </tr>
          </table>
        `
        : '';

      const introBlockHtml = isFirstPage
        ? `
          <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; margin-bottom:6pt;">
            <tr style="page-break-inside:avoid;">
              <td align="left" style="border:none; padding:0; font-size:9.5pt; font-weight:bold; text-align:left; font-family:Mangal, Arial, sans-serif;">
                सं. प.अ.क्षे.का./नि.सं./ ${escapeHtml(invoiceNumber || '')}
              </td>
              <td align="right" style="border:none; padding:0; font-size:9.5pt; text-align:right; font-family:Arial, sans-serif;">
                DT: ${escapeHtml(invoiceDate || '')}
              </td>
            </tr>
          </table>

          <div style="font-size:9.5pt; line-height:1.3; margin-bottom:8pt; font-family:Arial, sans-serif;">
            To,<br/>
            ${escapeHtml(parentOrder?.vendor || '')}<br/>
            21, Nilkanth Apartment, Samata Nagar,<br/>
            Pokharan Road No. 1, Thane (W) 400606
          </div>

          <div align="center" style="text-align:center; margin-top:6pt; margin-bottom:8pt;">
            <span style="font-size:12.5pt; font-weight:bold; text-decoration:underline; font-family:Arial, sans-serif;">
              Work Order${isPO ? ` PO No. ${escapeHtml(poNumber || '')}` : ''}
            </span>
          </div>

          <div style="font-size:9pt; margin-bottom:5pt; font-family:Arial, sans-serif;">
            The Following Photography Assignment Is Assigned To Your Agency.
          </div>
        `
        : '';

      const itemRowsHtml = pageItems
        .map((item) => {
          const globalIdx = selectedItems.indexOf(item);
          const amount = calculateItemAmount(item, companyDetails);
          const rate = getItemRate(item, companyDetails);
          const quantity = item.quantity || 1;
          const dimensionsText = getItemDimensionsText(item, quantity);

          const workMainLabel = item.workMain ? item.workMain.replaceAll('_', ' ') : 'N/A';
          const workSubLabel = item.workSub
            ? isVidhanMandal
              ? `कामाचे प्रकार : ${item.workSub.replaceAll('_', ' ')}`
              : item.workMain === 'Photo_Print' || item.workMain === 'Storage'
                ? `Size : ${item.workSub.replaceAll('_', ' ')}`
                : `Duration : ${item.workSub.replaceAll('_', ' ')}`
            : '';
          const dateLine = isVidhanMandal
            ? `कामाचा दिनांक: ${getOrderDateRange(item, 'ते')}`
            : `dt. ${getOrderDateRange(item)}`;
          const eventLine = isVidhanMandal
            ? `कामाचे नांव: ${item.eventName || ''}`
            : `For ${item.eventName || ''}`;
          const venueVal = item.eventVenue === 'Others' ? item.customVenue : item.eventVenue;
          const venueLine = isVidhanMandal
            ? `कामाचे स्थळ: ${venueVal || ''}`
            : `at ${venueVal || ''}`;

          return `
            <tr style="page-break-inside:avoid;">
              <td width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:3pt 3pt; text-align:center; vertical-align:middle; font-size:9pt; line-height:11.5pt;">
                ${globalIdx + 1}
              </td>
              <td width="56%" align="left" valign="middle" style="width:56%; border:1pt solid #000000; padding:3pt 5pt; text-align:left; vertical-align:middle; font-size:9pt; line-height:11.5pt;">
                <div style="font-weight:bold; margin:0;">${escapeHtml(workMainLabel)}</div>
                ${workSubLabel || dimensionsText ? `<div style="margin:0;">${escapeHtml(workSubLabel + dimensionsText)}</div>` : ''}
                <div style="margin:0;">${escapeHtml(dateLine)}</div>
                <div style="margin:0;">${escapeHtml(eventLine)}</div>
                <div style="margin:0;">${escapeHtml(venueLine)}</div>
              </td>
              <td width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:3pt 3pt; text-align:center; vertical-align:middle; font-size:9pt; line-height:11.5pt;">
                ${escapeHtml(quantity)}
              </td>
              <td width="13%" align="right" valign="middle" style="width:13%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; vertical-align:middle; font-size:9pt; line-height:11.5pt;">
                ${escapeHtml(rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; vertical-align:middle; font-size:9pt; line-height:11.5pt;">
                ${escapeHtml(amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
          `;
        })
        .join('');

      const continuedRowHtml = !isLastPage
        ? `
          <tr style="page-break-inside:avoid;">
            <td colspan="5" align="right" style="border:1pt solid #000000; padding:4pt 6pt; text-align:right; font-style:italic; font-weight:bold; background-color:#fcfcfc; font-size:9pt;">
              ${isVidhanMandal ? `(पुढे चालू - पान ${pageIdx + 2})` : `(Continued on Page ${pageIdx + 2}...)`}
            </td>
          </tr>
        `
        : '';

      const sigMarginTopPt = pageItems.length >= 8 ? 52 : pageItems.length >= 5 ? 68 : 88;

      const footerSectionHtml = isLastPage
        ? `
          <p style="margin:0; font-size:5pt; line-height:5pt;">&nbsp;</p>
          <table width="100%" border="1" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:1pt solid #000000; font-size:9pt;">
            <tr style="page-break-inside:avoid;">
              <td width="83%" align="right" valign="middle" style="width:83%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; font-weight:bold;">
                Total Cost
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right;">
                ${escapeHtml(totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
            <tr style="page-break-inside:avoid;">
              <td width="83%" align="right" valign="middle" style="width:83%; border:1pt solid #000000; padding:3pt 5pt; text-align:right;">
                CGST 9%
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right;">
                ${escapeHtml((totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
            <tr style="page-break-inside:avoid;">
              <td width="83%" align="right" valign="middle" style="width:83%; border:1pt solid #000000; padding:3pt 5pt; text-align:right;">
                SGST 9%
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right;">
                ${escapeHtml((totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
            <tr style="page-break-inside:avoid;">
              <td width="83%" align="right" valign="middle" style="width:83%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; font-weight:bold;">
                Total
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; font-weight:bold;">
                ${escapeHtml(totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
            <tr style="page-break-inside:avoid;">
              <td width="83%" align="right" valign="middle" style="width:83%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; font-weight:bold;">
                ${escapeHtml(`Round Up Rs. (${numberToWords(roundedTotal)})`)}
              </td>
              <td width="17%" align="right" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:right; font-weight:bold;">
                ${escapeHtml(roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
          </table>

          <p style="margin:0; font-size:5pt; line-height:5pt;">&nbsp;</p>
          <table width="100%" border="1" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:1pt solid #000000; font-size:9pt;">
            <tr style="page-break-inside:avoid;">
              <td width="12%" align="left" valign="middle" style="width:12%; border:1pt solid #000000; padding:3pt 5pt; text-align:left; font-weight:bold;">
                ${isVidhanMandal ? 'कामाचे नांव' : 'Event'}
              </td>
              <td width="88%" align="left" valign="middle" style="width:88%; border:1pt solid #000000; padding:3pt 5pt; text-align:left;">
                ${escapeHtml(eventSummaryText)}
              </td>
            </tr>
            <tr style="page-break-inside:avoid;">
              <td width="12%" align="left" valign="middle" style="width:12%; border:1pt solid #000000; padding:3pt 5pt; text-align:left; font-weight:bold;">
                ${isVidhanMandal ? 'कामाचा दिनांक' : 'Date'}
              </td>
              <td width="88%" align="left" valign="middle" style="width:88%; border:1pt solid #000000; padding:3pt 5pt; text-align:left;">
                ${escapeHtml(uniqueDates.join(', '))}
              </td>
            </tr>
          </table>

          <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; margin-top:${sigMarginTopPt}pt; margin-bottom:4pt;">
            <tr style="page-break-inside:avoid;">
              <td width="55%" style="width:55%; border:none;">&nbsp;</td>
              <td width="45%" align="center" style="width:45%; border:none; text-align:center; font-family:Mangal, Arial, sans-serif; font-size:10pt; line-height:1.45;">
                केलिए<br/>
                निगमित संचार विभाग<br/>
                पहिली मंजिल, एनबीपी ग्रीन हाइट्स,<br/>
                बीकेसी-बांद्रा-ईस्ट-मुंबई
              </td>
            </tr>
          </table>
        `
        : '';

      const pageBreakHtml =
        pageIdx < totalPages - 1
          ? '<p style="page-break-before:always; margin:0; padding:0; font-size:1pt; line-height:1pt;"><span style="mso-special-character:page-break;">&nbsp;</span></p>'
          : '';

      return `
        ${headerBlockHtml}
        ${introBlockHtml}
        <table width="100%" border="1" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:1pt solid #000000; font-size:9pt;">
          <thead>
            <tr style="page-break-inside:avoid;">
              <th width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:3pt 3pt; text-align:center; vertical-align:middle; font-weight:bold;">SR.<br/>NO.</th>
              <th width="56%" align="center" valign="middle" style="width:56%; border:1pt solid #000000; padding:3pt 5pt; text-align:center; vertical-align:middle; font-weight:bold;">${isVidhanMandal ? 'कामाचे स्वरूप' : 'WORK'}</th>
              <th width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:3pt 3pt; text-align:center; vertical-align:middle; font-weight:bold;">${isVidhanMandal ? 'नग' : 'QTY.'}</th>
              <th width="13%" align="center" valign="middle" style="width:13%; border:1pt solid #000000; padding:3pt 5pt; text-align:center; vertical-align:middle; font-weight:bold;">RATE</th>
              <th width="17%" align="center" valign="middle" style="width:17%; border:1pt solid #000000; padding:3pt 5pt; text-align:center; vertical-align:middle; font-weight:bold;">${isVidhanMandal ? 'रकम' : 'AMOUNT'}<br/>(RS.)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
            ${continuedRowHtml}
          </tbody>
        </table>
        ${footerSectionHtml}
        ${pageBreakHtml}
      `;
    })
    .join('\r\n');

  const safeInvoiceNumber = (invoiceNumber || 'preview').toString().replace(/[\/\\?%*:|"<>]/g, '-');
  downloadMhtmlWordDoc(pagesHtml, mimeImages, `WorkOrder_${safeInvoiceNumber}.docx`, 'Work Order Invoice');
};

export const exportVendorInvoiceToWord = async ({
  invoicePages,
  selectedItems,
  companyDetails,
  parentOrder,
  invoiceNumber,
  invoiceDate,
  dealingOfficer,
  emailId,
  vendorCode,
  poNumber,
  poDate,
  serviceDescription,
  gstNo,
  isVidhanMandal,
  isONGC,
  isIGST,
  amountBeforeTax,
  cgst,
  sgst,
  igst,
  total,
  rounded
}) => {
  const companyLogo = await loadImageAsMimePart('/logo.PNG', 1, {
    targetHeightPx: isVidhanMandal ? 58 : 85,
    maxWidthPx: 250
  });
  const signatureImg = await loadImageAsMimePart('/signature.png', 2, { targetHeightPx: 42, maxWidthPx: 110 });
  const stampImg = isVidhanMandal
    ? await loadImageAsMimePart('/stamp.png', 3, { targetHeightPx: 70, maxWidthPx: 70 })
    : null;

  const mimeImages = [companyLogo, signatureImg, stampImg].filter(Boolean);
  const effectivePages = invoicePages;
  const totalPages = effectivePages.length;
  const addressText = companyDetails?.address || parentOrder?.companyDetails?.address || '';
  const addressHtml = escapeHtml(addressText).replace(/\r?\n/g, '<br/>');

  const pagesHtml = effectivePages
    .map((pageItems, pageIdx) => {
      const isFirstPage = pageIdx === 0;
      const isLastPage = pageIdx === totalPages - 1;

      if (isVidhanMandal) {
        const allDates = selectedItems
          .flatMap((i) => [
            i.parent?.eventDate || i.eventStartDate,
            i.eventEndDate || i.parent?.eventEndDate || i.parent?.workItems?.[0]?.eventEndDate
          ])
          .filter(Boolean)
          .sort();
        const headerDateRange =
          allDates.length === 0 ? 'N/A' : formatEventDateDisplay(allDates[0], allDates[allDates.length - 1], 'ते');

        const vidhanHeaderHtml = isFirstPage
          ? `
            <tr>
              <td colspan="5" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold; font-size:12pt; text-align:center;">
                TAX INVOICE
              </td>
            </tr>
            <tr>
              <td colspan="3" valign="top" style="border:1pt solid #000000; padding:0; vertical-align:top;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none;">
                  <tr>
                    <td style="border:none; padding:6pt; font-size:11pt; line-height:1.4;">
                      <b>प्रति,</b><br/>
                      ${addressHtml}
                    </td>
                  </tr>
                  <tr>
                    <td style="border:none; border-top:1pt solid #000000; padding:5pt 6pt; font-weight:bold; font-size:10pt;">
                      GST No. ${escapeHtml(gstNo || '')}
                    </td>
                  </tr>
                </table>
              </td>
              <td colspan="2" valign="top" style="border:1pt solid #000000; padding:0; vertical-align:top;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none;">
                  <tr>
                    <td style="border:none; border-bottom:1pt solid #000000; padding:6pt;">
                      ${
                        companyLogo
                          ? `<img src="${companyLogo.contentLocation}" width="${companyLogo.width}" height="${companyLogo.height}" alt="Logo" />`
                          : ''
                      }
                    </td>
                  </tr>
                  <tr>
                    <td style="border:none; padding:4pt 6pt; font-size:9.5pt; line-height:1.35;">
                      21, Nilkanth Aprtment, Samata Nagar,<br/>
                      Pokharan Road No. 1, Thane (W) 400 606<br/>
                      E-mail : bhogtevijay@gmail.com
                    </td>
                  </tr>
                  <tr>
                    <td style="border:none; border-top:1pt solid #000000; padding:0;">
                      <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none;">
                        <tr>
                          <td width="50%" style="border:none; border-right:1pt solid #000000; padding:5pt 6pt; font-size:9.5pt;">
                            Invoice No.: ${escapeHtml(invoiceNumber || '')}
                          </td>
                          <td width="50%" style="border:none; padding:5pt 6pt; font-size:9.5pt;">
                            Date: ${escapeHtml(invoiceDate || '')}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="5" style="border:1pt solid #000000; padding:0;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; font-size:9.5pt;">
                  <tr>
                    <td width="20%" style="border:1pt solid #000000; padding:3pt 6pt; font-weight:bold;">कक्ष क्रमांक</td>
                    <td width="80%" style="border:1pt solid #000000; padding:3pt 6pt;">${escapeHtml(convertEnglishToMarathiNumbers(selectedItems[0]?.parent?.roomNumber) || 'ई-२')}</td>
                  </tr>
                  <tr>
                    <td width="20%" style="border:1pt solid #000000; padding:3pt 6pt; font-weight:bold;">कामाचा दिनांक :</td>
                    <td width="80%" style="border:1pt solid #000000; padding:3pt 6pt;">${escapeHtml(convertEnglishToMarathiNumbers(headerDateRange))}</td>
                  </tr>
                  <tr>
                    <td width="20%" style="border:1pt solid #000000; padding:3pt 6pt; font-weight:bold;">कामाचे नांव :</td>
                    <td width="80%" style="border:1pt solid #000000; padding:3pt 6pt;">${escapeHtml(selectedItems[0]?.eventName || '')}</td>
                  </tr>
                  <tr>
                    <td width="20%" style="border:1pt solid #000000; padding:3pt 6pt; font-weight:bold;">कामाचे स्थळ :</td>
                    <td width="80%" style="border:1pt solid #000000; padding:3pt 6pt;">${escapeHtml(selectedItems[0]?.eventVenue === 'Others' ? selectedItems[0]?.customVenue : selectedItems[0]?.eventVenue || '')}</td>
                  </tr>
                </table>
              </td>
            </tr>
          `
          : '';

        const vidhanRowsHtml = pageItems
          .map((item) => {
            const globalIdx = selectedItems.indexOf(item);
            const rate = calculateItemAmount({ ...item, quantity: 1 }, companyDetails);
            const amount = calculateItemAmount(item, companyDetails);
            const dateStr = getOrderDateRange(item, 'ते');
            const workMainMap = { Photography: 'फोटोग्राफी', Videography: 'व्हिडीओग्राफी' };
            const workStr = workMainMap[item.workMain] || (item.workMain ? item.workMain.replaceAll('_', ' ') : '');
            const durationMap = { '8_Hours': '८ तासापर्यन्त', '4_Hours': '४ तासापर्यन्त', '12_Hours': '१२ तासापर्यन्त' };
            const subStr = durationMap[item.workSub] || (item.workSub ? item.workSub.replaceAll('_', ' ') : '');

            let desc = '';
            if (item.workMain === '32_GB_Pendrive') {
              desc = '३२ जीबी पेनड्राईव्ह';
            } else if (item.workMain === '64_GB_Pendrive') {
              desc = '६४ जीबी पेनड्राईव्ह';
            } else {
              desc = `दि. ${dateStr} ${workStr} ${subStr}`;
            }

            return `
              <tr>
                <td width="6%" align="center" style="border:1pt solid #000000; padding:4pt; text-align:center;">${escapeHtml(convertEnglishToMarathiNumbers(globalIdx + 1))}</td>
                <td width="54%" align="left" style="border:1pt solid #000000; padding:4pt 6pt; text-align:left;">${escapeHtml(convertEnglishToMarathiNumbers(desc))}</td>
                <td width="10%" align="center" style="border:1pt solid #000000; padding:4pt; text-align:center;">${escapeHtml(convertEnglishToMarathiNumbers(item.quantity || 1))}</td>
                <td width="15%" align="right" style="border:1pt solid #000000; padding:4pt 6pt; text-align:right;">${escapeHtml(convertEnglishToMarathiNumbers(rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })))}</td>
                <td width="15%" align="right" style="border:1pt solid #000000; padding:4pt 6pt; text-align:right;">${escapeHtml(convertEnglishToMarathiNumbers(amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })))}</td>
              </tr>
            `;
          })
          .join('');

        const vidhanFooterHtml = isLastPage
          ? `
            <tr>
              <td colspan="3" style="border:1pt solid #000000; padding:5pt 6pt; font-weight:bold;">
                अक्षरी रुपये : ${escapeHtml(numberToMarathiWords(amountBeforeTax))} फक्त
              </td>
              <td align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold;">
                एकूण जीएसटीसह रक्कम रु.
              </td>
              <td align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold;">
                ${escapeHtml(convertEnglishToMarathiNumbers(amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })))}
              </td>
            </tr>
            <tr>
              <td colspan="5" style="border:1pt solid #000000; padding:0;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; font-size:9pt;">
                  <tr>
                    <td width="35%" valign="top" style="border-right:1pt solid #000000; padding:4pt 6pt; line-height:1.4;">
                      GST No. 27ABJPB2133M5ZO<br/>
                      Pan No. ABJPB2133M<br/>
                      <b>Bank Details</b><br/>
                      Bank Name : State Bank Of India<br/>
                      Bank A/C No. : 34238092999<br/>
                      Bank IFSC Code : SBIN0013035
                    </td>
                    <td width="35%" align="center" valign="middle" style="border-right:1pt solid #000000; padding:6pt; text-align:center;">
                      ${
                        stampImg
                          ? `<img src="${stampImg.contentLocation}" width="${stampImg.width}" height="${stampImg.height}" alt="Stamp" />`
                          : ''
                      }
                      <div style="font-size:8.5pt; line-height:1.2;">
                        Vijay R. Bhogte<br/>
                        ${escapeHtml(new Date().toISOString().slice(0, 10).replace(/-/g, '.'))}
                      </div>
                    </td>
                    <td width="30%" align="center" valign="top" style="padding:0; text-align:center;">
                      <div style="border-bottom:1pt solid #000000; padding:4pt; font-weight:bold;">For Icomp Systems</div>
                      <div style="height:36pt;">&nbsp;</div>
                      <div style="border-top:1pt solid #000000; padding:4pt; font-weight:bold;">Authorised Signatory</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `
          : `
            <tr>
              <td colspan="5" align="right" style="border:1pt solid #000000; padding:6pt 8pt; text-align:right; font-weight:bold; font-style:italic;">
                (पुढे चालू - पान ${escapeHtml(convertEnglishToMarathiNumbers(pageIdx + 2))})
              </td>
            </tr>
          `;

        return `
          <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:1.5pt solid #000000; font-size:9.5pt;">
            ${vidhanHeaderHtml}
            <tr>
              <th width="6%" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold;">Sr.<br/>No</th>
              <th width="54%" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold;">Description Of Items</th>
              <th width="10%" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold;">Quantity</th>
              <th width="15%" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold;">With GST Rate<br/>Rs.</th>
              <th width="15%" align="center" style="border:1pt solid #000000; padding:4pt; font-weight:bold;">Total Amount<br/>Rs.</th>
            </tr>
            ${vidhanRowsHtml}
            ${vidhanFooterHtml}
          </table>
          ${pageIdx < totalPages - 1 ? '<p style="page-break-before:always; margin:0; padding:0; font-size:1pt; line-height:1pt;">&nbsp;</p>' : ''}
        `;
      }

      // Standard Vendor Invoice (6-column layout: 7%, 47%, 8%, 12%, 12%, 14% -> Rate+Amount = 26%)
      const headerHtml = isFirstPage
        ? `
          <tr>
            <td colspan="3" width="55%" valign="top" style="width:55%; border:1pt solid #000000; padding:8pt 10pt; vertical-align:top;">
              <div style="font-weight:bold; font-size:13pt; margin-bottom:4pt;">To,</div>
              <div style="font-size:10.5pt; line-height:1.4;">${addressHtml}</div>
            </td>
            <td colspan="3" width="45%" valign="top" align="right" style="width:45%; border:1pt solid #000000; padding:8pt 10pt; text-align:right; vertical-align:top;">
              ${
                companyLogo
                  ? `<div align="right" style="text-align:right; margin-bottom:6pt;"><img src="${companyLogo.contentLocation}" width="${companyLogo.width}" height="${companyLogo.height}" alt="Company Logo" style="width:${companyLogo.width}px; height:${companyLogo.height}px;" /></div>`
                  : ''
              }
              <div style="font-size:8.5pt; line-height:1.35; text-align:right;">
                21, Nilkanth Aprtment, Samata Nagar, Pokharan Road No. 1,<br/>
                Thane (W) 400 606 &nbsp;&nbsp; E-mail : bhogtevijay@gmail.com
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="3" width="55%" valign="top" style="width:55%; border:1pt solid #000000; padding:6pt 10pt; font-size:10.5pt; line-height:1.45; vertical-align:top;">
              ${
                isONGC
                  ? `
                    <div><b>Dealing Officer:</b> ${escapeHtml(dealingOfficer || '')}</div>
                    <div><b>Email ID:</b> ${escapeHtml(emailId || '')}</div>
                  `
                  : ''
              }
              <div><b>GST No.:</b> ${escapeHtml(gstNo || '')}</div>
              ${
                isONGC
                  ? `
                    <div><b>PO No.:</b> ${escapeHtml(poNumber || '')}</div>
                    <div><b>PO Date:</b> ${escapeHtml(poDate || '')}</div>
                  `
                  : ''
              }
            </td>
            <td colspan="3" width="45%" valign="top" style="width:45%; border:1pt solid #000000; padding:0; vertical-align:top;">
              <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; font-size:10.5pt;">
                <tr>
                  <td width="42%" valign="middle" style="width:42%; border:none; border-right:1pt solid #000000; ${isONGC ? 'border-bottom:1pt solid #000000;' : ''} padding:6pt 6pt; font-weight:bold;">
                    Invoice No.: ${escapeHtml(invoiceNumber || '')}
                  </td>
                  <td width="58%" valign="middle" style="width:58%; border:none; ${isONGC ? 'border-bottom:1pt solid #000000;' : ''} padding:6pt 6pt; font-weight:bold;">
                    Date: ${escapeHtml(invoiceDate || '')}
                  </td>
                </tr>
                ${
                  isONGC
                    ? `
                      <tr>
                        <td colspan="2" valign="top" style="border:none; padding:6pt 6pt; line-height:1.45;">
                          <div><b>Vendor Code:</b> ${escapeHtml(vendorCode || '')}</div>
                          <div><b>Place Of Supply:</b> Mumbai</div>
                          <div><b>Service Description :</b> ${escapeHtml(serviceDescription || '')}</div>
                        </td>
                      </tr>
                    `
                    : ''
                }
              </table>
            </td>
          </tr>
        `
        : '';

      const itemRowsHtml = pageItems
        .map((item) => {
          const globalIdx = selectedItems.indexOf(item);
          const amount = calculateItemAmount(item, companyDetails);
          const rate = getItemRate(item, companyDetails);
          const quantity = item.quantity || 1;
          const dimensionsText = getItemDimensionsText(item, quantity);
          const venueVal = item.eventVenue === 'Others' ? item.customVenue : item.eventVenue;
          const subLabel =
            item.workMain === 'Photo_Print' || item.workMain === 'Storage' ? 'Size:' : 'Location and Duration:';
          const subVal = item.workSub ? ` ${item.workSub.replaceAll('_', ' ')}` : '';

          return `
            <tr>
              <td width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:5pt 4pt; text-align:center; vertical-align:middle; font-size:10.5pt;">
                ${globalIdx + 1}
              </td>
              <td width="47%" align="left" valign="middle" style="width:47%; border:1pt solid #000000; padding:5pt 6pt; text-align:left; vertical-align:middle; font-size:10.5pt; line-height:1.38;">
                <b>Event Date:</b> ${escapeHtml(getOrderDateRange(item, 'to'))}<br/>
                <b>Event Name:</b> ${escapeHtml(item.eventName || '')}<br/>
                <b>Venue:</b> ${escapeHtml(venueVal || '')}<br/>
                <b>Work Type:</b> ${escapeHtml(item.workMain ? item.workMain.replaceAll('_', ' ') : '')}${
                  item.workMain !== '32_GB_Pendrive'
                    ? `<br/><b>${escapeHtml(subLabel)}</b>${escapeHtml(subVal + dimensionsText)}`
                    : ''
                }
              </td>
              <td width="8%" align="center" valign="middle" style="width:8%; border:1pt solid #000000; padding:5pt 4pt; text-align:center; vertical-align:middle; font-size:10.5pt;">
                ${escapeHtml(quantity)}
              </td>
              <td width="12%" align="center" valign="middle" style="width:12%; border:1pt solid #000000; padding:5pt 4pt; text-align:center; vertical-align:middle; font-size:10.5pt;">
                99838
              </td>
              <td width="12%" align="center" valign="middle" style="width:12%; border:1pt solid #000000; padding:5pt 6pt; text-align:center; vertical-align:middle; font-size:10.5pt;">
                ${escapeHtml(rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
              <td width="14%" align="right" valign="middle" style="width:14%; border:1pt solid #000000; padding:5pt 6pt; text-align:right; vertical-align:middle; font-size:10.5pt;">
                ${escapeHtml(amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              </td>
            </tr>
          `;
        })
        .join('');

      const footerRowsHtml = isLastPage
        ? `
          <tr>
            <td colspan="5" align="right" style="border:1pt solid #000000; border-bottom:none; padding:4pt 6pt; text-align:right; font-size:10pt;">
              Amount Before Tax:
            </td>
            <td align="right" style="border:1pt solid #000000; border-bottom:none; padding:4pt 6pt; text-align:right; font-size:10pt;">
              ${escapeHtml(amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            </td>
          </tr>
          ${
            isIGST
              ? `
                <tr>
                  <td colspan="5" align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    IGST 18%:
                  </td>
                  <td align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    ${escapeHtml(igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  </td>
                </tr>
              `
              : `
                <tr>
                  <td colspan="5" align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    CGST 9%:
                  </td>
                  <td align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    ${escapeHtml(cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  </td>
                </tr>
                <tr>
                  <td colspan="5" align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    SGST 9%:
                  </td>
                  <td align="right" style="border-left:1pt solid #000000; border-right:1pt solid #000000; padding:4pt 6pt; text-align:right; font-size:10pt;">
                    ${escapeHtml(sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  </td>
                </tr>
              `
          }
          <tr>
            <td colspan="5" align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold; font-size:10pt;">
              Total Amount Rs.:
            </td>
            <td align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold; font-size:10pt;">
              ${escapeHtml(total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            </td>
          </tr>
          <tr>
            <td colspan="4" align="left" style="border:1pt solid #000000; padding:5pt 8pt; text-align:left; font-weight:bold; font-size:9.5pt;">
              In Words: ${escapeHtml(numberToWords(rounded))}
            </td>
            <td align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold; font-size:10pt;">
              Round up Rs.:
            </td>
            <td align="right" style="border:1pt solid #000000; padding:5pt 6pt; text-align:right; font-weight:bold; font-size:10pt;">
              ${escapeHtml(rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="border:1pt solid #000000; padding:0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:none; font-size:9.5pt;">
                <tr>
                  <td width="34%" valign="top" style="width:34%; border:none; border-right:1pt solid #000000; padding:6pt 8pt; line-height:1.4;">
                    <b>GST No. 27ABJPB2133M5ZO</b><br/>
                    <b>Pan No. ABJPB2133M</b><br/>
                    <b>Bank Details:</b><br/>
                    Bank Name: State Bank Of India<br/>
                    Bank A/C No.: 34238902999<br/>
                    Bank IFSC Code: SBIN0013035
                  </td>
                  <td width="34%" align="center" valign="bottom" style="width:34%; border:none; border-right:1pt solid #000000; padding:6pt 8pt; text-align:center; vertical-align:bottom; font-weight:bold;">
                    Digital Signature
                  </td>
                  <td width="32%" align="center" valign="top" style="width:32%; border:none; padding:6pt 8pt; text-align:center;">
                    <div style="font-weight:bold; margin-bottom:6pt;">For ${escapeHtml(parentOrder?.vendor || 'Vendor')}</div>
                    ${
                      signatureImg
                        ? `<div align="center" style="text-align:center; margin:4pt 0;"><img src="${signatureImg.contentLocation}" width="${signatureImg.width}" height="${signatureImg.height}" alt="Signature" style="width:${signatureImg.width}px; height:${signatureImg.height}px;" /></div>`
                        : '<div style="height:32pt;">&nbsp;</div>'
                    }
                    <div style="font-weight:bold; margin-top:6pt;">Authorised Signatory</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
        : `
          <tr>
            <td colspan="6" align="right" style="border:1pt solid #000000; padding:6pt 8pt; text-align:right; font-style:italic; font-weight:bold; background-color:#fafafa; font-size:10pt;">
              (Continued on Page ${pageIdx + 2}...)
            </td>
          </tr>
        `;

      return `
        <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border:1.5pt solid #000000; background-color:#ffffff;">
          ${headerHtml}
          <tr>
            <th width="7%" align="center" valign="middle" style="width:7%; border:1pt solid #000000; padding:4pt 4pt; text-align:center; font-weight:bold; font-size:9.5pt;">SR. NO</th>
            <th width="47%" align="center" valign="middle" style="width:47%; border:1pt solid #000000; padding:4pt 6pt; text-align:center; font-weight:bold; font-size:9.5pt;">DESCRIPTION OF ITEMS</th>
            <th width="8%" align="center" valign="middle" style="width:8%; border:1pt solid #000000; padding:4pt 4pt; text-align:center; font-weight:bold; font-size:9.5pt;">QTY.</th>
            <th width="12%" align="center" valign="middle" style="width:12%; border:1pt solid #000000; padding:4pt 4pt; text-align:center; font-weight:bold; font-size:9.5pt;">HSN CODE</th>
            <th width="12%" align="center" valign="middle" style="width:12%; border:1pt solid #000000; padding:4pt 4pt; text-align:center; font-weight:bold; font-size:9.5pt;">RATE RS.</th>
            <th width="14%" align="center" valign="middle" style="width:14%; border:1pt solid #000000; padding:4pt 4pt; text-align:center; font-weight:bold; font-size:9.5pt;">AMOUNT RS.</th>
          </tr>
          ${itemRowsHtml}
          ${footerRowsHtml}
        </table>
        ${pageIdx < totalPages - 1 ? '<p style="page-break-before:always; margin:0; padding:0; font-size:1pt; line-height:1pt;">&nbsp;</p>' : ''}
      `;
    })
    .join('\r\n');

  const safeInvoiceNumber = (invoiceNumber || 'preview').toString().replace(/[\/\\?%*:|"<>]/g, '-');
  downloadMhtmlWordDoc(pagesHtml, mimeImages, `IcompSystemInvoice_${safeInvoiceNumber}.docx`, 'IcompSystem Invoice');
};
