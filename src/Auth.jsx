import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';
import Auth from './Auth';

function App() {
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // 1. Écouteur de session
  useEffect(() => {
    // Vérification initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((err) => {
      console.error("Erreur session:", err);
      setLoading(false);
    });

    // Écoute des changements d'état d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Charger profil et produits dès que la session est active
  useEffect(() => {
    if (!session?.user) {
      setProducts([]);
      setUserName('');
      return;
    }

    // Récupération du pseudo
    const fetchUser = async () => {
      try {
        if (session.user.user_metadata?.username) {
          setUserName(session.user.user_metadata.username);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.username) {
          setUserName(data.username);
        } else {
          setUserName('Utilisateur');
        }
      } catch (e) {
        setUserName('Utilisateur');
      }
    };

    // Récupération des produits
    const fetchProductsData = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error("Erreur fetch products:", error);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (e) {
        console.error("Erreur produits:", e);
        setProducts([]);
      }
    };

    fetchUser();
    fetchProductsData();
  }, [session]);

  const refreshProducts = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });
    setProducts(data || []);
  };

  // 3. Gestion du formulaire (Ajout / Modif)
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
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editId);
      setEditId(null);
    } else {
      await supabase
        .from('products')
        .insert([productData]);
    }

    setForm({ name: '', category: '', quantity: '', price: '' });
    refreshProducts();
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
  };

  const handleDelete = async (id) => {
    if (!session?.user) return;
    await supabase
      .from('products')
      .delete()
      .eq('id', id);
    refreshProducts();
  };

  // Affichage pendant la vérification initiale
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#fff' }}>
        Chargement de l'application...
      </div>
    );
  }

  // Si non connecté
  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* En-tête */}
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