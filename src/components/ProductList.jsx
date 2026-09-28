import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css';

function ProductList({ products, form, setForm, editId, handleSubmit, handleEdit, handleDelete, currency = '€' }) {
  // États locaux pour la recherche et le filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Référence pour cibler l'input du nom lors de l'édition
  const nameInputRef = useRef(null);

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

  // Gestion de la modification avec focus
  const onEditClick = (product) => {
    handleEdit(product);
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  // Confirmation avant suppression
  const onDeleteClick = (id, name) => {
    if (window.confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) {
      handleDelete(id);
    }
  };

  // --- FONCTION EXPORT CSV ---
  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = ["Nom", "Categorie", "Quantite", `Prix_Unitaire_${currency}`];
    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.quantity,
      p.price
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventaire_stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FONCTION EXPORT PDF ---
  const exportToPDF = () => {
    if (filteredProducts.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const doc = new jsPDF();

    // En-tête du document PDF
    doc.setFontSize(18);
    doc.text("Rapport d'Inventaire du Stock", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28);
    doc.text(`Total produits : ${totalItems} | Valeur totale : ${totalValue.toFixed(2)} ${currency}`, 14, 34);

    // Tableau des produits
    const tableColumn = ["Nom du produit", "Catégorie", "Quantité", `Prix (${currency})`, `Total (${currency})` ];
    const tableRows = filteredProducts.map((p) => [
      p.name,
      p.category || '-',
      p.quantity,
      `${Number(p.price).toFixed(2)} ${currency}`,
      `${(Number(p.price) * Number(p.quantity)).toFixed(2)} ${currency}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 }
    });

    doc.save(`inventaire_stock_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Gestion de Stock</h1>
      </div>

      {/* BLOC 1 : Statistiques / Résumé */}
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
            ref={nameInputRef}
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

      {/* BLOC 2 : Barre de Recherche, Filtre et Boutons d'Exportation */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

        {/* BOUTONS D'EXPORTATION DISCRETS */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', paddingTop: '4px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {filteredProducts.length} produit(s) affiché(s)
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={exportToCSV} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              📄 Exporter en CSV
            </button>
            <button onClick={exportToPDF} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
             Exporter en PDF
            </button>
          </div>
        </div>
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
                <button onClick={() => onEditClick(p)} className="btn btn-outline">Modifier</button>
                <button onClick={() => onDeleteClick(p.id, p.name)} className="btn btn-danger">Supprimer</button>
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
                    <button onClick={() => onEditClick(p)} className="btn btn-outline">Modifier</button>
                    <button onClick={() => onDeleteClick(p.id, p.name)} className="btn btn-danger">Supprimer</button>
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