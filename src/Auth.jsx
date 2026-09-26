import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Gérer la connexion ou l'inscription
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    if (isSignUp) {
      // Inscription avec enregistrement du nom d'utilisateur dans les métadonnées
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMsg('Un compte existe déjà avec cet email.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setMessage('Inscription réussie ! Un email de confirmation vous a été envoyé.');
      }
    } else {
      // Connexion
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg('Email ou mot de passe incorrect.');
      }
    }
    setLoading(false);
  };

  // Gérer la réinitialisation de mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Un email de réinitialisation vous a été envoyé.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '400px', marginTop: '60px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {isForgotPassword
            ? 'Réinitialiser le mot de passe'
            : isSignUp
            ? 'Créer un compte'
            : 'Connexion'}
        </h2>

        {/* Vue "Mot de passe oublié" */}
        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="form-input"
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              <span
                onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setMessage(''); }}
                style={{ color: '#38bdf8', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
              >
                Retour à la connexion
              </span>
            </p>
          </form>
        ) : (
          /* Vue "Connexion / Inscription" */
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isSignUp && (
              <input
                className="form-input"
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}

            <input
              className="form-input"
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="form-input"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>
        )}

        {/* Messages d'information ou d'erreur */}
        {message && <p style={{ marginTop: '14px', color: '#38bdf8', fontSize: '0.875rem', textAlign: 'center' }}>{message}</p>}
        {errorMsg && <p style={{ marginTop: '14px', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{errorMsg}</p>}

        {/* Navigation du bas */}
        {!isForgotPassword && (
          <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p>
              {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"} {' '}
              <span 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setMessage(''); }} 
                style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </span>
            </p>

            {!isSignUp && (
              <p>
                <span 
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setMessage(''); }} 
                  style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  Mot de passe oublié ?
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}