import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Masquage technique de l'email pour Supabase Auth
  const formatInternalEmail = (name) => {
    const cleanUsername = name.trim().toLowerCase().replace(/\s+/g, '_');
    return `${cleanUsername}@app.local`;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    const cleanUsername = username.trim();
    const internalEmail = formatInternalEmail(cleanUsername);

    if (isSignUp) {
      // Vérification de l'unicité du nom d'utilisateur
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg("Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.");
        setLoading(false);
        return;
      }

      // Inscription
      const { error } = await supabase.auth.signUp({
        email: internalEmail,
        password: password,
        options: {
          data: { username: cleanUsername }
        }
      });

      if (error) {
        setErrorMsg("Erreur lors de l'inscription : " + error.message);
      } else {
        setMessage('Compte créé avec succès ! Connexion en cours...');
      }

    } else {
      // Connexion via nom d'utilisateur + mot de passe
      const { error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: password,
      });

      if (error) {
        setErrorMsg("Nom d'utilisateur ou mot de passe incorrect.");
      }
    }

    setLoading(false);
  };

  // Style universel pour étirer les inputs à 100%
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #475569',
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#f8fafc' }}>
          {isSignUp ? 'Créer un compte' : 'Connexion'}
        </h2>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Nom d'utilisateur
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Votre nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Mot de passe
            </label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
          </button>
        </form>

        {message && <p style={{ marginTop: '14px', color: '#4ade80', fontSize: '0.875rem', textAlign: 'center' }}>{message}</p>}
        {errorMsg && <p style={{ marginTop: '14px', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{errorMsg}</p>}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          <p>
            {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"} {' '}
            <span
              onClick={() => { 
                setIsSignUp(!isSignUp); 
                setErrorMsg(''); 
                setMessage(''); 
              }}
              style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
            >
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}