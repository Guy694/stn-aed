import "./globals.css";

export const metadata = {
  title: 'ระบบจัดการเครื่อง AED จังหวัดสตูล',
  description: 'ระบบบริหารจัดการและแสดงจุดบริการเครื่อง Automated External Defibrillator (AED) จังหวัดสตูล',
  keywords: 'AED, สตูล, เครื่องกู้ชีพ, สาธารณสุข',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
