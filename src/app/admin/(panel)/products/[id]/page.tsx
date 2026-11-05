import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { adminCategories, adminProduct } from '@/lib/adminData';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([adminProduct(id), adminCategories()]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl text-gold">Edit product</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
