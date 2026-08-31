import { Image as ImageIcon } from 'lucide-react';

export default function CampaignImage({ src, alt = '', className = '', iconSize = 'w-8 h-8' }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50 dark:from-navy-800 dark:to-navy-700 ${className}`}>
        <ImageIcon className={`text-primary-400 dark:text-primary-500 ${iconSize}`} strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
