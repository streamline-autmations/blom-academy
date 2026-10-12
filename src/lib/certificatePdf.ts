// Renders the certificate to a canvas and wraps it in a single-page A4 landscape PDF.
// No PDF library: the page is one JPEG image, which PDF can embed as-is (DCTDecode).

interface CertificateOptions {
  name: string;
  courseTitle: string;
  date: string;
  accentColor: string;
}

const PAGE_W_PT = 842; // A4 landscape
const PAGE_H_PT = 595;
const SCALE = 3; // canvas pixels per PDF point
const FONT = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });

// Shrinks the font until the text fits, so long names/course titles never overflow the page.
const fitText = (ctx: CanvasRenderingContext2D, text: string, weight: string, startPx: number, maxWidth: number) => {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
};

const renderCertificate = async ({ name, courseTitle, date, accentColor }: CertificateOptions) => {
  const logo = await loadImage('/blom-academy.png');
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W_PT * SCALE;
  canvas.height = PAGE_H_PT * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported');

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W_PT, PAGE_H_PT);

  // Double border in the accent colour
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, PAGE_W_PT - 48, PAGE_H_PT - 48);
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, PAGE_W_PT - 72, PAGE_H_PT - 72);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = PAGE_W_PT / 2;
  const maxW = PAGE_W_PT - 160;

  ctx.fillStyle = accentColor;
  fitText(ctx, 'CERTIFICATE OF COMPLETION', 'bold', 40, maxW);
  ctx.fillText('CERTIFICATE OF COMPLETION', cx, 120);

  ctx.fillStyle = '#4b5563';
  ctx.font = `18px ${FONT}`;
  ctx.fillText('This certificate is proudly presented to', cx, 175);

  ctx.fillStyle = '#1f2937';
  fitText(ctx, name, 'italic bold', 46, maxW);
  ctx.fillText(name, cx, 240);

  ctx.fillStyle = '#4b5563';
  ctx.font = `18px ${FONT}`;
  ctx.fillText('for successfully completing the course', cx, 290);

  ctx.fillStyle = '#1f2937';
  fitText(ctx, courseTitle, 'bold', 32, maxW);
  ctx.fillText(courseTitle, cx, 340);

  ctx.fillStyle = '#6b7280';
  ctx.font = `15px ${FONT}`;
  ctx.fillText(`on ${date}`, cx, 380);

  const logoH = 90;
  const logoW = (logo.width / logo.height) * logoH;
  ctx.drawImage(logo, cx - logoW / 2, 410, logoW, logoH);

  return canvas;
};

const canvasToJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return reject(new Error('Could not encode certificate image'));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      'image/jpeg',
      0.92,
    );
  });

const buildPdf = (jpeg: Uint8Array, imgW: number, imgH: number) => {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObject = (num: number) => {
    offsets[num] = length;
    push(`${num} 0 obj\n`);
  };

  const content = `q ${PAGE_W_PT} 0 0 ${PAGE_H_PT} 0 0 cm /Im0 Do Q`;

  push('%PDF-1.4\n');
  startObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObject(2);
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObject(3);
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W_PT} ${PAGE_H_PT}] ` +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
  );
  startObject(4);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  );
  push(jpeg);
  push('\nendstream\nendobj\n');
  startObject(5);
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefStart = length;
  push('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
};

export const downloadCertificatePdf = async (options: CertificateOptions & { fileName: string }) => {
  const canvas = await renderCertificate(options);
  const jpeg = await canvasToJpeg(canvas);
  const pdf = buildPdf(jpeg, canvas.width, canvas.height);

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = options.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
