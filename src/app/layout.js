import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext';
import './globals.css'
import "react-toastify/dist/ReactToastify.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sterna Admin Dashboard',
  description: 'Generated by create next app',
}

export default function RootLayout({ children }) {
  return (
    <html className='overscroll-none' lang="en">
      <body className={inter.className}>
      <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
