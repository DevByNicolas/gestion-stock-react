import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductList from './components/ProductList';
import Auth from './Auth';
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);
  
  // Onglet actif : 'dashboard', 'products', 'add', 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Devise sélectionnée
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('app_currency') || '€';
  });

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  // Gérer la session d'authentification
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

      if (error) {
        console.error('Erreur de modification :', error);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === editId ? { ...p, ...productData } : p))
        );
      }
      setEditId(null);
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.error("Erreur d'ajout :", error);
      } else if (data && data[0]) {
        setProducts((prev) => [...prev, data[0]]);
      }
    }

    setForm({ name: '', category: '', quantity: '', price: '' });
    setActiveTab('products'); // Redirige automatiquement vers la liste après ajout/modification
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.id);
    setActiveTab('add'); // Redirige vers le formulaire pour modifier
  };

  const handleDelete = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur de suppression :', error);
      fetchProducts();
    }
  };

  // Calculs pour l'écran Tableau de bord (Accueil)
  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.quantity) || 0), 0);
  const totalItems = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const lowStockCount = products.filter((p) => Number(p.quantity) <= 5).length;

  // 1. Écran d'animation au tout premier chargement
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Écran d'attente bref
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

  const displayUsername = session.user.user_metadata?.username || 'Utilisateur';

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <main className="main-content" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px 16px 90px 16px' }}>
        
        {/* --- ONGLET 1 : ACCUEIL / TABLEAU DE BORD --- */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff' }}>
                Bonjour, <span style={{ color: '#3b82f6' }}>{displayUsername}</span> 👋
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                Aperçu global de votre stock FlowStock
              </p>
            </div>

            {/* Cartes de statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>Valeur du stock</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6', marginTop: '6px' }}>
                  {totalValue.toLocaleString()} {currency}
                </p>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>Nombre de références</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginTop: '6px' }}>
                  {products.length}
                </p>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>Articles en réserve</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginTop: '6px' }}>
                  {totalItems}
                </p>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>Stock faible (≤ 5)</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: lowStockCount > 0 ? '#ef4444' : '#10b981', marginTop: '6px' }}>
                  {lowStockCount}
                </p>
              </div>
            </div>

            {/* Accès rapide */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setActiveTab('products')} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                Voir le stock complet
              </button>
              <button onClick={() => { setEditId(null); setForm({ name: '', category: '', quantity: '', price: '' }); setActiveTab('add'); }} className="btn btn-outline" style={{ flex: 1, padding: '12px', marginRight: 0 }}>
                + Nouveau produit
              </button>
            </div>
          </div>
        )}

        {/* --- ONGLET 2 : STOCK / LISTE DES PRODUITS --- */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff' }}>
                Inventaire des produits ({products.length})
              </h2>
              <button 
                onClick={() => { setEditId(null); setForm({ name: '', category: '', quantity: '', price: '' }); setActiveTab('add'); }} 
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                + Ajouter
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
              currency={currency}
              hideForm={true} // Seule la liste s'affiche ici
            />
          </div>
        )}

        {/* --- ONGLET 3 : FORMULAIRE D'AJOUT OU MODIFICATION --- */}
        {activeTab === 'add' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
              {editId ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
            </h2>

            <div className="card">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Nom du produit *</label>
                  <input
                    type="text"
                    placeholder="Ex: Écran OLED"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Catégorie</label>
                  <input
                    type="text"
                    placeholder="Ex: Électronique"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Quantité</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Prix ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {editId ? 'Mettre à jour' : 'Enregistrer le produit'}
                  </button>
                  
                  {editId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditId(null); setForm({ name: '', category: '', quantity: '', price: '' }); setActiveTab('products'); }} 
                      className="btn btn-outline"
                      style={{ marginRight: 0 }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- ONGLET 4 : PROFIL & PARAMÈTRES --- */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
              Mon Profil & Paramètres
            </h2>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Utilisateur connecté</span>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', marginTop: '2px' }}>
                  {displayUsername}
                </p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{session.user.email}</p>
              </div>

              <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>Devise d'affichage</span>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Utilisée pour le calcul de la valeur du stock</p>
                </div>

                <select
                  value={currency}
                  onChange={handleCurrencyChange}
                  style={{
                    padding: '8px 12px',
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

              <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

              <button 
                onClick={() => supabase.auth.signOut()} 
                className="btn btn-danger"
                style={{ padding: '12px', width: '100%', marginTop: '8px' }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Barre de navigation fixée en bas */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;