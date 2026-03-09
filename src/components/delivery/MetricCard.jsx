import React from 'react';

const MetricCard = ({ label, value, hint, tone = 'text-white' }) => {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a2332] p-4 shadow-lg shadow-black/10">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</div>
      <div className={`mt-3 text-3xl font-black ${tone}`}>{value}</div>
      {hint ? <div className="mt-2 text-sm text-gray-400">{hint}</div> : null}
    </div>
  );
};

export default MetricCard;
