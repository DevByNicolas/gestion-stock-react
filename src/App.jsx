import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);

  // 1. Charger les produits au démarrage depuis Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération :', error);
    } else {
      setProducts(data);
    }
  };

  // 2. Ajouter ou Modifier un produit dans Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    const productData = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    if (editId) {
      // Modification dans la base de données
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editId);

      if (error) console.error('Erreur de modification :', error);
      setEditId(null);
    } else {
      // Insertion dans la base de données
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) console.error("Erreur d'ajout :", error);
    }

    setForm({ name: '', category: '', quantity: '', price: '' });
    fetchProducts(); // Recharger la liste mise à jour
  };

  // 3. Préparer l'édition d'un produit
  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
  };

  // 4. Supprimer un produit dans Supabase
  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur de suppression :', error);
    } else {
      fetchProducts(); // Recharger la liste
    }
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