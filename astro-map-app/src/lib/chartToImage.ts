import { toPng } from 'html-to-image';

/**
 * Convert an SVG element to a PNG data URL
 * @param element - The container element to convert
 * @param backgroundColor - Background color for the image (default: dark theme)
 * @returns Promise<string> - Data URL of the PNG image
 */
export async function chartToImageDataUrl(
  element: HTMLElement,
  backgroundColor: string = '#0f172a'
): Promise<string> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor,
      cacheBust: true,
      includeQueryParams: true,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error converting chart to image:', error);
    throw new Error('Falha ao converter gráfico para imagem');
  }
}

/**
 * Convert an SVG element to a blob for PDF embedding
 * @param element - The container element to convert
 * @param backgroundColor - Background color for the image
 * @returns Promise<Blob> - PNG blob
 */
export async function chartToBlob(
  element: HTMLElement,
  backgroundColor: string = '#0f172a'
): Promise<Blob> {
  try {
    const dataUrl = await chartToImageDataUrl(element, backgroundColor);
    
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    return blob;
  } catch (error) {
    console.error('Error converting chart to blob:', error);
    throw new Error('Falha ao converter gráfico');
  }
}

/**
 * Create an image element from the chart
 * @param element - The container element to convert
 * @param backgroundColor - Background color for the image
 * @returns Promise<HTMLImageElement> - Image element ready for use
 */
export async function chartToImage(
  element: HTMLElement,
  backgroundColor: string = '#0f172a'
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    chartToImageDataUrl(element, backgroundColor)
      .then(dataUrl => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      })
      .catch(reject);
  });
}

/**
 * Get chart dimensions for sizing
 */
export function getChartDimensions(
  containerWidth: number,
  containerHeight: number,
  maxWidth: number = 400,
  maxHeight: number = 400
): { width: number; height: number } {
  const size = Math.min(containerWidth, containerHeight, maxWidth, maxHeight);
  return { width: size, height: size };
}