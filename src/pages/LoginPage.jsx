import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Store, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, resetPassword } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Determine where to redirect after login
  const from = location.state?.from?.pathname || "/dashboard/pdv";

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!isRecovery) {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (isSignup) {
        if (!formData.name) {
          newErrors.name = 'Nome é obrigatório';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'As senhas não conferem';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isRecovery) {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setAuthError(error.message);
        } else {
          setIsRecovery(false);
          setFormData({ email: '', password: '', name: '', confirmPassword: '' });
          setAuthError(null);
        }
      } else if (isSignup) {
        const { error } = await signup(formData.email, formData.password, formData.name);
        if (error) {
          setAuthError(error.message);
        } else {
          // Typically auto-login or ask to check email. 
          // If auth context handles auto-login on signup success, navigate.
          // Supabase by default may require email confirmation, 
          // so check the toast message from AuthContext.
        }
      } else {
        const { error } = await login(formData.email, formData.password);
        if (error) {
          setAuthError(error.message);
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setAuthError('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
    // Clear global auth error when user starts typing again
    if (authError) {
      setAuthError(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2332] flex items-center justify-center p-4">
      <Helmet>
        <title>{isSignup ? 'Cadastro' : isRecovery ? 'Recuperar Senha' : 'Login'} - PDV System</title>
        <meta name="description" content="Sistema de gestão comercial e ponto de venda" />
      </Helmet>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00d084] rounded-2xl mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PDV System</h1>
          <p className="text-gray-400">Sistema de Gestão Comercial</p>
        </div>

        <div className="bg-[#2a3a4a] rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            {isRecovery ? 'Recuperar Senha' : isSignup ? 'Criar Conta' : 'Entrar'}
          </h2>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && !isRecovery && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {!isRecovery && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {isSignup && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00d084] hover:bg-[#00b872] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                isRecovery ? 'Enviar Email' : isSignup ? 'Cadastrar' : 'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            {!isRecovery && !isSignup && (
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(true);
                  setAuthError(null);
                  setErrors({});
                }}
                className="text-[#00d084] hover:text-[#00b872] text-sm transition-colors block mx-auto"
              >
                Esqueceu sua senha?
              </button>
            )}

            <div className="pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setIsRecovery(false);
                  setErrors({});
                  setAuthError(null);
                }}
                className="text-gray-300 hover:text-white text-sm transition-colors block mx-auto"
              >
                {isSignup ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Cadastre-se'}
              </button>
            </div>

            {isRecovery && (
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(false);
                  setErrors({});
                  setAuthError(null);
                }}
                className="text-gray-300 hover:text-white text-sm transition-colors block mx-auto"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 PDV System. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;