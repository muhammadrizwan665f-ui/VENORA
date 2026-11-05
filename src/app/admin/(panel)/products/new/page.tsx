import ProductForm from '@/components/admin/ProductForm';
import { adminCategories } from '@/lib/adminData';

export default async function NewProduct() {
  const categories = await adminCategories();
  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl text-gold">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
