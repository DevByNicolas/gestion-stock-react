import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';
import Auth from './Auth';
import SplashScreen from './components/SplashScreen';// Si le fichier est dans 'src/components/', utilise './components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);
  
  // Devise sélectionnée
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('app_currency') || '€';
  });

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  // Gérer la session d'authentification sans bloquer l'interface
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger les produits uniquement si un utilisateur est connecté
  useEffect(() => {
    if (session?.user) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [session]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération :', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Erreur réseau / Supabase :', err);
      setProducts([]);
    }
  };

  // Ajouter ou Modifier un produit avec mise à jour immédiate de l'affichage
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !session?.user) return;

    const productData = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      price: Number(form.price) || 0,
      user_id: session.user.id
    };

    if (editId) {
      // 1. Modification dans Supabase
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editId);

      if (error) {
        console.error('Erreur de modification :', error);
      } else {
        // Mise à jour immédiate dans le tableau React
        setProducts((prev) =>
          prev.map((p) => (p.id === editId ? { ...p, ...productData } : p))
        );
      }
      setEditId(null);
    } else {
      // 2. Ajout dans Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.error("Erreur d'ajout :", error);
      } else if (data && data[0]) {
        // Ajout immédiat dans le tableau React
        setProducts((prev) => [...prev, data[0]]);
      }
    }

    setForm({ name: '', category: '', quantity: '', price: '' });
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
  };

  // Supprimer un produit avec retrait immédiat de l'affichage
  const handleDelete = async (id) => {
    // Retrait immédiat de l'écran pour réactivité instantanée sur mobile
    setProducts((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur de suppression :', error);
      // En cas d'erreur, on recharge la vraie liste
      fetchProducts();
    }
  };

  // 1. Écran d'animation au tout premier chargement de l'application
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Écran d'attente bref pendant la lecture du token local
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#f8fafc' }}>
        Chargement...
      </div>
    );
  }

  // 3. Si l'utilisateur n'est pas connecté
  if (!session) {
    return <Auth />;
  }

  // Récupération de l'affichage du nom (metadata ou fallback)
  const displayUsername = session.user.user_metadata?.username || 'Utilisateur';

  return (
    <div style={{ position: 'relative' }}>
      {/* Barre d'en-tête */}
      <div 
        style={{ 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          padding: '10px 20px', 
          maxWidth: '850px', 
          margin: '0 auto',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ color: '#f8fafc', fontWeight: '600' }}>
           Bonjour, <span style={{ color: '#ffffff' }}>{displayUsername}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Devise :</label>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="€">EUR (€)</option>
              <option value="$">USD ($)</option>
              <option value="FCFA">FCFA</option>
            </select>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="btn btn-outline">
            Déconnexion
          </button>
        </div>
      </div>

      <ProductList
        products={products}
        form={form}
        setForm={setForm}
        editId={editId}
        handleSubmit={handleSubmit}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        currency={currency}
      />
    </div>
  );
}

export default App;