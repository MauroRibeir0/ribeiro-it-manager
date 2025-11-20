import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Loader, AlertTriangle } from 'lucide-react';

interface AuthProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const Auth: React.FC<AuthProps> = ({ onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Captura o URL atual do browser para garantir que o email redirecione de volta para aqui
    // e não para localhost
    const currentUrl = window.location.origin;

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onNotify('Bem-vindo de volta!', 'success');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: currentUrl, // Força o redirecionamento para a URL correta
          },
        });
        if (error) throw error;
        onNotify('Registo efetuado! Verifique o seu email para confirmar.', 'info');
        setMode('login');
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: currentUrl, // Força o redirecionamento para a URL correta
        });
        if (error) throw error;
        onNotify('Email de recuperação enviado.', 'success');
        setMode('login');
      }
    } catch (error: any) {
      onNotify(error.error_description || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="bg-ribeiro-red p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-lg mx-auto flex items-center justify-center text-ribeiro-red font-bold text-3xl mb-4 shadow-lg">
            R
          </div>
          <h1 className="text-white text-2xl font-bold">Ribeiro, Lda.</h1>
          <p className="text-red-100 text-sm mt-1">Tecnologias e Serviços</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {mode === 'login' && 'Entrar na Conta'}
            {mode === 'register' && 'Criar Nova Conta'}
            {mode === 'recovery' && 'Recuperar Senha'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ribeiro-red focus:outline-none"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== 'recovery' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ribeiro-red focus:outline-none"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ribeiro-dark text-white py-3 rounded-lg font-bold shadow-md hover:bg-black transition-colors flex justify-center items-center"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Registar'}
                  {mode === 'recovery' && 'Enviar Link'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <p className="text-sm text-gray-600">
                  Ainda não tem conta?{' '}
                  <button onClick={() => setMode('register')} className="text-ribeiro-red font-bold hover:underline">
                    Registe-se
                  </button>
                </p>
                <button onClick={() => setMode('recovery')} className="text-xs text-gray-500 hover:underline">
                  Esqueceu a senha?
                </button>
              </>
            )}

            {mode === 'register' && (
              <p className="text-sm text-gray-600">
                Já tem conta?{' '}
                <button onClick={() => setMode('login')} className="text-ribeiro-red font-bold hover:underline">
                  Faça Login
                </button>
              </p>
            )}

            {mode === 'recovery' && (
              <button onClick={() => setMode('login')} className="text-sm text-ribeiro-red font-bold hover:underline">
                Voltar ao Login
              </button>
            )}
          </div>
        </div>
        
        {/* Warning for demo/first run */}
        <div className="bg-yellow-50 p-3 text-xs text-yellow-800 text-center border-t border-yellow-100">
            <AlertTriangle size={12} className="inline mr-1 mb-0.5"/>
            Sistema conectado a Supabase
        </div>
      </div>
    </div>
  );
};

export default Auth;