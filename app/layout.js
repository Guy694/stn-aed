import "./globals.css";
import { Prompt } from 'next/font/google';
import VisitorCounterBadge from '@/components/VisitorCounterBadge';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata = {
  title: 'ระบบติดตามจุดบริการสาธารณสุข จังหวัดสตูล',
  description: 'ระบบบริหารจัดการและแสดงจุดบริการเครื่อง Automated External Defibrillator (AED) จังหวัดสตูล',
  keywords: 'AED, สตูล, เครื่องกู้ชีพ, สาธารณสุข',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${prompt.className} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <VisitorCounterBadge />
      </body>
    </html>
  );
}
