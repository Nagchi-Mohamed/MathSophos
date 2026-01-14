'use client';

import { useState } from 'react';

export default function SeedTriggerPage() {
  const [status, setStatus] = useState<string>('Idle');
  const [result, setResult] = useState<any>(null);

  const handleSeed = async () => {
    setStatus('Seeding...');
    try {
      const response = await fetch('/api/seed-exercises', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
      setStatus('Done');
    } catch (error: any) {
      setResult({ error: error.message });
      setStatus('Error');
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Seed Exercises Trigger</h1>
      <button
        onClick={handleSeed}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={status === 'Seeding...'}
      >
        {status === 'Seeding...' ? 'Seeding...' : 'Start Seeding'}
      </button>

      <div className="mt-4">
        <p>Status: {status}</p>
        {result && (
          <pre className="bg-gray-100 p-4 mt-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
