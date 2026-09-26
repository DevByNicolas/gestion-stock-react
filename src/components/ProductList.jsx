import React from 'react';
import '../App.css';

function ProductList({ products, form, setForm, editId, handleSubmit, handleEdit, handleDelete, currency = '€' }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Gestion de Stock</h1>
      </div>

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
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />
          <input
            className="form-input"
            type="number"
            placeholder={`Prix (${currency})`}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <button type="submit" className="btn btn-primary">
            {editId ? 'Enregistrer' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* VUE MOBILE : Cartes (affichées uniquement sur petit écran) */}
      <div className="mobile-cards-container">
        {products.map((p) => (
          <div key={p.id} className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{p.name}</span>
              <span className="badge">{p.category}</span>
            </div>
            
            <div className="mobile-card-body">
              <div>
                <span className="label">Stock :</span> <strong>{p.quantity}</strong>
              </div>
              <div>
                <span className="label">Prix :</span> <strong>{Number(p.price).toFixed(2)} {currency}</strong>
              </div>
            </div>

            <div className="mobile-card-actions">
              <button onClick={() => handleEdit(p)} className="btn btn-outline">Modifier</button>
              <button onClick={() => handleDelete(p.id)} className="btn btn-danger">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {/* VUE DESKTOP : Tableau (masqué sur mobile) */}
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
            {products.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td><span className="badge">{p.category}</span></td>
                <td>{p.quantity}</td>
                <td>{Number(p.price).toFixed(2)} {currency}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleEdit(p)} className="btn btn-outline">Modifier</button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductList;