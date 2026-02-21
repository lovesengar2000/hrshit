import './globals.css';

export const metadata = {
  title: 'HR Dashboard',
  description: 'HR Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
