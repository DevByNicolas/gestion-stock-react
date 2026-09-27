import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';
import Auth from './Auth';

function App() {
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState('');
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

  // Récupérer le pseudo
  const getUserProfile = useCallback(async (user) => {
    if (!user) return;
    try {
      if (user.user_metadata?.username) {
        setUserName(user.user_metadata.username);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.username) {
        setUserName(data.username);
      } else {
        setUserName('Utilisateur');
      }
    } catch (err) {
      setUserName('Utilisateur');
    }
  }, []);

  // Charger les produits
  const fetchProducts = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Erreur récupération :', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      setProducts([]);
    }
  }, []);

  // Gérer la session d'authentification (exécuté UNE SEULE FOIS au montage)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getUserProfile(session.user);
        fetchProducts(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getUserProfile(session.user);
        fetchProducts(session.user.id);
      } else {
        setUserName('');
        setProducts([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [getUserProfile, fetchProducts]);

  // Ajouter ou Modifier un produit
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
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editId);

      if (error) console.error('Erreur modification :', error);
      setEditId(null);
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) console.error("Erreur ajout :", error);
    }

    setForm({ name: '', category: '', quantity: '', price: '' });
    fetchProducts(session.user.id);
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
  };

  const handleDelete = async (id) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
    } else {
      fetchProducts(session.user.id);
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div 
        style={{ 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          padding: '12px 20px', 
          maxWidth: '850px', 
          margin: '0 auto',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '1rem' }}>
          👋 Bonjour, <span style={{ color: '#38bdf8' }}>{userName || 'Utilisateur'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Devise :</label>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              style={{
                padding: '6px 10px',
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