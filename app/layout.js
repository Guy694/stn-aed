import "./globals.css";
import VisitorCounterBadge from '@/components/VisitorCounterBadge';

export const metadata = {
  title: 'ระบบติดตามจุดบริการเครื่องกู้ชีพ AED สตูล',
  description: 'ระบบบริหารจัดการและแสดงจุดบริการเครื่อง Automated External Defibrillator (AED) จังหวัดสตูล',
  keywords: 'AED, สตูล, เครื่องกู้ชีพ, สาธารณสุข',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <VisitorCounterBadge />
      </body>
    </html>
  );
}
