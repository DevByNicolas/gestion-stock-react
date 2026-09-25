import { useState } from 'react';
import ProductList from './components/ProductList';

function App() {
  const [products, setProducts] = useState([
    { id: 1, name: 'Clavier Mécanique', category: 'Périphériques', quantity: 15, price: 89.99 },
    { id: 2, name: 'Écran 27" 4K', category: 'Affichage', quantity: 8, price: 349.99 },
  ]);

  const [form, setForm] = useState({ name: '', category: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    if (editId) {
      setProducts(products.map(p => p.id === editId ? { ...form, id: editId } : p));
      setEditId(null);
    } else {
      setProducts([...products, { ...form, id: Date.now() }]);
    }
    setForm({ name: '', category: '', quantity: '', price: '' });
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
  };

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <ProductList
      products={products}
      form={form}
      setForm={setForm}
      editId={editId}
      handleSubmit={handleSubmit}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
    />
  );
}

export default App;