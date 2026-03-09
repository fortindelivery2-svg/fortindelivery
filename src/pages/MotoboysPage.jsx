import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Plus, Bike, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotoboys } from '@/hooks/useMotoboys';
import MotoboysTable from '@/components/MotoboysTable';
import MotoboyCadastroModal from '@/components/MotoboyCadastroModal';

const MotoboysPage = () => {
  const { motoboys, loading, createMotoboy, updateMotoboy, deleteMotoboy } = useMotoboys();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // todos, ativo, inativo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMotoboy, setEditingMotoboy] = useState(null);

  const handleCreate = async (data) => {
    await createMotoboy(data);
  };

  const handleUpdate = async (data) => {
    if (editingMotoboy) {
      await updateMotoboy(editingMotoboy.id, data);
    }
  };

  const handleEditClick = (motoboy) => {
    setEditingMotoboy(motoboy);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (motoboy) => {
    if (window.confirm(`Tem certeza que deseja excluir o motoboy ${motoboy.nome}?`)) {
      await deleteMotoboy(motoboy.id);
    }
  };

  const handleOpenNew = () => {
    setEditingMotoboy(null);
    setIsModalOpen(true);
  };

  // Filter Logic
  const filteredMotoboys = motoboys.filter(moto => {
    const matchesSearch = 
      moto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moto.cpf.includes(searchTerm) ||
      (moto.telefone && moto.telefone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'todos' || moto.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-[#0f1419] min-h-full">
      <Helmet>
        <title>Motoboys - Gestão de Entregadores</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#00d084]" />
            Motoboys
          </h1>
          <p className="text-gray-400">Gerencie sua frota de entregadores parceiros</p>
        </div>
        <Button 
          onClick={handleOpenNew}
          className="bg-[#00d084] hover:bg-[#00b872] text-white font-bold shadow-lg shadow-[#00d084]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Motoboy
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full bg-[#0f1419] border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00d084] focus:outline-none"
          />
        </div>
        <div className="w-full md:w-48 relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="w-full bg-[#0f1419] border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white appearance-none focus:border-[#00d084] focus:outline-none cursor-pointer"
           >
             <option value="todos">Todos Status</option>
             <option value="ativo">Ativos</option>
             <option value="inativo">Inativos</option>
           </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#00d084]" />
            <p>Carregando motoboys...</p>
          </div>
        ) : (
          <MotoboysTable 
            motoboys={filteredMotoboys}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      <MotoboyCadastroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingMotoboy ? handleUpdate : handleCreate}
        motoboy={editingMotoboy}
      />
    </div>
  );
};

export default MotoboysPage;