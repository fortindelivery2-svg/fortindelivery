import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const PessoasPage = () => {
  const [pessoas, setPessoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadPessoas();
      
      const subscription = supabase
        .channel('pessoas_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pessoas', filter: `user_id=eq.${user.id}` }, (payload) => {
           loadPessoas(); 
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadPessoas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      setPessoas(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar pessoas',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Check CPF uniqueness if provided
      if (formData.cpf) {
        const { data: existing } = await supabase
          .from('pessoas')
          .select('id')
          .eq('user_id', user.id)
          .eq('cpf', formData.cpf)
          .single();
          
        if (existing && existing.id !== editingId) {
          throw new Error('CPF já cadastrado para outra pessoa.');
        }
      }

      const payload = { ...formData, user_id: user.id };

      if (editingId) {
        const { error } = await supabase
          .from('pessoas')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: 'Pessoa atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('pessoas')
          .insert([payload]);

        if (error) throw error;
        toast({ title: 'Pessoa cadastrada com sucesso!' });
      }

      resetForm();
      // Optimistically update or just wait for subscription
      loadPessoas();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pessoa) => {
    setFormData({
      nome: pessoa.nome,
      cpf: pessoa.cpf || '',
      email: pessoa.email || '',
      telefone: pessoa.telefone || '',
      endereco: pessoa.endereco || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado || ''
    });
    setEditingId(pessoa.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir esta pessoa?')) {
      try {
        const { error } = await supabase
          .from('pessoas')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: 'Pessoa excluída com sucesso!' });
        loadPessoas();
      } catch (error) {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredPessoas = pessoas.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cpf && p.cpf.includes(searchTerm)) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <Helmet>
        <title>Pessoas - PDV System</title>
        <meta name="description" content="Gerenciamento de pessoas e clientes" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Pessoas</h1>
        <p className="text-gray-400">Gerenciar cadastro de clientes e pessoas</p>
      </div>

      <div className="bg-[#2a3a4a] rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF ou email..."
              className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none"
            />
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#00d084] hover:bg-[#00b872] text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Pessoa
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Nome</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">CPF</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Telefone</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Cidade</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : filteredPessoas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Nenhuma pessoa encontrada
                  </td>
                </tr>
              ) : (
                filteredPessoas.map((pessoa) => (
                  <tr key={pessoa.id} className="border-b border-gray-700 hover:bg-[#1a2332] transition-colors">
                    <td className="py-3 px-4 text-white">{pessoa.nome}</td>
                    <td className="py-3 px-4 text-gray-300">{pessoa.cpf}</td>
                    <td className="py-3 px-4 text-gray-300">{pessoa.email}</td>
                    <td className="py-3 px-4 text-gray-300">{pessoa.telefone}</td>
                    <td className="py-3 px-4 text-gray-300">{pessoa.cidade} - {pessoa.estado}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEdit(pessoa)}
                        className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pessoa.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a3a4a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#2a3a4a] border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Editar Pessoa' : 'Nova Pessoa'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#00d084] focus:outline-none"
                    placeholder="UF"
                    maxLength="2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#00d084] hover:bg-[#00b872] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingId ? 'Atualizar' : 'Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PessoasPage;