import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formatage propre et cohérent de l'email interne
  const formatInternalEmail = (name) => {
    const cleanUsername = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanUsername}.user@gmail.com`;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg("Veuillez entrer un nom d'utilisateur valide.");
      setLoading(false);
      return;
    }

    const internalEmail = formatInternalEmail(cleanUsername);

    try {
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email: internalEmail,
          password: password,
          options: {
            data: { username: cleanUsername }
          }
        });

        if (error) {
          setErrorMsg("Erreur d'inscription : " + error.message);
        } else {
          setMessage('Compte créé avec succès ! Connexion en cours...');
        }
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: password,
        });

        if (error) {
          setErrorMsg("Nom d'utilisateur ou mot de passe incorrect.");
        }
      }
    } catch (err) {
      setErrorMsg("Une erreur réseau s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setMessage('');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '16px' }}>
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          borderRadius: '24px', 
          padding: '32px 24px', 
          boxSizing: 'border-box',
          position: 'relative' 
        }}
      >
        {/* Bouton de retour (fleche) */}
        <button
          type="button"
          onClick={toggleAuthMode}
          title="Changer de mode"
          style={{
            background: 'none',
            border: 'none',
            color: '#f8fafc',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: '4px 8px',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
        >
          ←
        </button>

        {/* Titres inspirés de la maquette */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Créer un compte.' : 'Content de vous revoir.'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.4' }}>
            {isSignUp 
              ? 'Accédez à votre gestion de stock en moins de deux minutes.' 
              : 'Connectez-vous pour accéder à votre inventaire.'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
              Nom d'utilisateur
            </label>
            <input
              className="form-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '0.95rem'
              }}
              type="text"
              placeholder="ex: Jordan N."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
              Mot de passe
            </label>
            <input
              className="form-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '0.95rem'
              }}
              type="password"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              marginTop: '10px', 
              padding: '14px', 
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            {loading ? 'Chargement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Messages d'information */}
        {message && <p style={{ marginTop: '16px', color: '#4ade80', fontSize: '0.875rem', textAlign: 'center' }}>{message}</p>}
        {errorMsg && <p style={{ marginTop: '16px', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{errorMsg}</p>}

        {/* Lien de bascule en bas de page */}
        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          <p style={{ margin: 0 }}>
            {isSignUp ? 'Déjà un compte ?' : 'Nouveau sur l’application ?'} {' '}
            <button
              type="button"
              onClick={toggleAuthMode}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}