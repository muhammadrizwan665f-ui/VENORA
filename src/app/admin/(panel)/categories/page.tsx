import ImageField from '@/components/admin/ImageField';
import { adminCategories } from '@/lib/adminData';
import { deleteCategory, saveCategory } from '../../actions';

export default async function CategoriesAdmin() {
  const cats = await adminCategories();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-gold">Categories</h1>
      {cats.map((c) => (
        <form key={c.id} action={saveCategory} className="grid gap-3 rounded-2xl border border-gold/25 bg-coal p-5 md:grid-cols-2">
          <input type="hidden" name="id" value={c.id} />
          <label><span className="label-lux">Name</span><input name="name" defaultValue={c.name} className="input-lux" required /></label>
          <label><span className="label-lux">Slug</span><input name="slug" defaultValue={c.slug} className="input-lux" required /></label>
          <label className="md:col-span-2"><span className="label-lux">Description</span><input name="description" defaultValue={c.description} className="input-lux" /></label>
          <ImageField name="image" defaultValue={c.image} label="Image" />
          <label><span className="label-lux">Sort order</span><input name="sort" type="number" defaultValue={c.sort} className="input-lux" /></label>
          <div className="flex gap-3 md:col-span-2">
            <button className="btn-gold !py-2">Save</button>
            <button formAction={deleteCategory} className="btn-outline !border-red-400/60 !py-2 !text-red-300">Delete</button>
          </div>
        </form>
      ))}
      <form action={saveCategory} className="grid gap-3 rounded-2xl border border-dashed border-gold/40 p-5 md:grid-cols-2">
        <h2 className="font-serif text-xl md:col-span-2">Add category</h2>
        <label><span className="label-lux">Name *</span><input name="name" className="input-lux" required /></label>
        <label><span className="label-lux">Slug (auto if empty)</span><input name="slug" className="input-lux" /></label>
        <label className="md:col-span-2"><span className="label-lux">Description</span><input name="description" className="input-lux" /></label>
        <ImageField name="image" label="Image" />
        <label><span className="label-lux">Sort order</span><input name="sort" type="number" defaultValue={cats.length + 1} className="input-lux" /></label>
        <button className="btn-gold w-fit !py-2 md:col-span-2">Add category</button>
      </form>
      <p className="text-xs text-mute">A category that still contains products cannot be deleted; move or delete those products first.</p>
    </div>
  );
}
