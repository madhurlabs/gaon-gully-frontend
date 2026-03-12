import type { Metadata } from 'next';
import StoreLayout from '@/components/layout/StoreLayout';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Gaon Gully - Retail & Wholesale Marketplace',
  description: 'Shop the best products at retail and wholesale prices. Quality goods, fast delivery, secure payments across India.',
};

export default function HomePage() {
  return (
    <StoreLayout>
      <HomeClient />
    </StoreLayout>
  );
}
