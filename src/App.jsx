import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';
import Auth from './Auth';

function App() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);

  // Gérer la session d'authentification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. Charger les produits uniquement si un utilisateur est connecté
  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session]);

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

  // Si l'utilisateur n'est pas connecté, afficher le composant Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px', maxWidth: '850px', margin: '0 auto' }}>
        <button onClick={() => supabase.auth.signOut()} className="btn btn-outline">
          Déconnexion
        </button>
      </div>

      <ProductList
        products={products}
        form={form}
        setForm={setForm}
        editId={editId}
        handleSubmit={handleSubmit}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </div>
  );
}

export default App;