import React, { useState, useMemo } from 'react';
import '../App.css';

function ProductList({ products, form, setForm, editId, handleSubmit, handleEdit, handleDelete, currency = '€' }) {
  // États locaux pour la recherche et le filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // 1. Liste dynamique de toutes les catégories existantes (sans doublons)
  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean);
    return [...new Set(cats)];
  }, [products]);

  // 2. Filtrage des produits selon la recherche et la catégorie
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // 3. Calculs automatiques pour le tableau de bord
  const totalValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0);
  }, [filteredProducts]);

  const totalItems = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + Number(p.quantity), 0);
  }, [filteredProducts]);

  const lowStockCount = useMemo(() => {
    return filteredProducts.filter((p) => Number(p.quantity) < 5).length;
  }, [filteredProducts]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Gestion de Stock</h1>
      </div>

      {/* BLOC 1 : Statistiques / Résumé (Textes et valeurs en Blanc Pur) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Valeur du Stock</span>
          <h2 style={{ color: '#ffffff', margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
            {totalValue.toFixed(2)} {currency}
          </h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Articles en Stock</span>
          <h2 style={{ color: '#ffffff', margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
            {totalItems}
          </h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Alertes Stock Faible (&lt; 5)</span>
          <h2 style={{ color: lowStockCount > 0 ? '#f59e0b' : '#ffffff', margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
            {lowStockCount}
          </h2>
        </div>
      </div>

      {/* FORMULAIRE D'AJOUT / MODIFICATION */}
      <div className="card">
        <form onSubmit={handleSubmit} className="product-form">
          <input
            className="form-input"
            type="text"
            placeholder="Nom du produit"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Catégorie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Qté"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input
            className="form-input"
            type="number"
            placeholder={`Prix (${currency})`}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <button type="submit" className="btn btn-primary">
            {editId ? 'Enregistrer' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* BLOC 2 : Barre de Recherche et Filtre */}
      <div className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          className="form-input"
          style={{ flex: 2, minWidth: '200px' }}
          type="text"
          placeholder="🔍 Rechercher un produit par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-input"
          style={{ flex: 1, minWidth: '150px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* VUE MOBILE : Cartes */}
      <div className="mobile-cards-container">
        {filteredProducts.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Aucun produit trouvé.</p>
        ) : (
          filteredProducts.map((p) => (
            <div key={p.id} className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{p.name}</span>
                {p.category && <span className="badge">{p.category}</span>}
              </div>
              
              <div className="mobile-card-body">
                <div>
                  <span className="label">Stock :</span>{' '}
                  <strong style={{ color: '#ffffff' }}>
                    {p.quantity} {Number(p.quantity) < 5 && '⚠️ (Faible)'}
                  </strong>
                </div>
                <div>
                  <span className="label">Prix :</span>{' '}
                  <strong style={{ color: '#ffffff' }}>{Number(p.price).toFixed(2)} {currency}</strong>
                </div>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => handleEdit(p)} className="btn btn-outline">Modifier</button>
                <button onClick={() => handleDelete(p.id)} className="btn btn-danger">Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* VUE DESKTOP : Tableau */}
      <div className="table-container desktop-table">
        <table className="product-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Stock</th>
              <th>Prix unitaire</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  Aucun produit ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.category ? <span className="badge">{p.category}</span> : '-'}</td>
                  <td>
                    <span>
                      {p.quantity} {Number(p.quantity) < 5 && '⚠️'}
                    </span>
                  </td>
                  <td>{Number(p.price).toFixed(2)} {currency}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleEdit(p)} className="btn btn-outline">Modifier</button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-danger">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductList;