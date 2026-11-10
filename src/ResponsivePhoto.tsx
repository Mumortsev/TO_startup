export type PhotoAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
  variants?: { src: string; width: number }[];
};
export function photoSrcSet(photo: PhotoAsset) {
  return photo.variants?.map(item => `${item.src} ${item.width}w`).join(', ');
}
export default function ResponsivePhoto({ photo, eager = false, className = '', sizes = '(max-width: 760px) 88vw, 45vw' }: {
  photo: PhotoAsset; eager?: boolean; className?: string; sizes?: string;
}) {
  return <img className={className} src={photo.src} srcSet={photoSrcSet(photo)} sizes={sizes} alt={photo.alt} width={photo.width} height={photo.height} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />;
}
