import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Bike, Building, FileText } from 'lucide-react';

const DeliveryDataSection = ({ 
  motoboys = [], 
  formData, 
  onChange, 
  errors = {} 
}) => {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-[#2d3e52] rounded-xl border border-gray-700 p-5 space-y-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 text-white font-bold text-sm uppercase border-b border-gray-600 pb-2 mb-2">
        <Bike className="w-4 h-4 text-[#00d084]" />
        Dados de Entrega
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Motoboy Selection */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Motoboy Responsável *
          </label>
          <div className="relative">
            <select
              value={formData.motoboy_id || ''}
              onChange={(e) => handleChange('motoboy_id', e.target.value)}
              className={`w-full bg-[#1a2332] border rounded-lg px-3 py-2.5 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#00d084] ${
                errors.motoboy_id ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="">Selecione um motoboy...</option>
              {motoboys.map((moto) => (
                <option key={moto.id} value={moto.id}>
                  {moto.nome} {moto.telefone ? `(${moto.telefone})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Bike className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          {errors.motoboy_id && <span className="text-red-400 text-xs mt-1">{errors.motoboy_id}</span>}
        </div>

        {/* Address Fields */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Endereço *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.endereco || ''}
              onChange={(e) => handleChange('endereco', e.target.value)}
              placeholder="Rua, Avenida, Logradouro..."
              className={`w-full bg-[#1a2332] border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#00d084] ${
                errors.endereco ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.endereco && <span className="text-red-400 text-xs mt-1">{errors.endereco}</span>}
        </div>

        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Número *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.numero || ''}
              onChange={(e) => handleChange('numero', e.target.value)}
              placeholder="123"
              className={`w-full bg-[#1a2332] border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#00d084] ${
                errors.numero ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.numero && <span className="text-red-400 text-xs mt-1">{errors.numero}</span>}
        </div>

        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Bairro *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.bairro || ''}
              onChange={(e) => handleChange('bairro', e.target.value)}
              placeholder="Centro"
              className={`w-full bg-[#1a2332] border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#00d084] ${
                errors.bairro ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.bairro && <span className="text-red-400 text-xs mt-1">{errors.bairro}</span>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={formData.complemento || ''}
            onChange={(e) => handleChange('complemento', e.target.value)}
            placeholder="Apto 101, Bloco B (Opcional)"
            className="w-full bg-[#1a2332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00d084]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-300 uppercase font-bold mb-1">
            Observações de Entrega
          </label>
          <div className="relative">
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Ponto de referência, instruções para o entregador..."
              rows={2}
              className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#00d084] resize-none"
            />
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeliveryDataSection;