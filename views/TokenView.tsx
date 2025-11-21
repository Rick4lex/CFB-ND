import React, { useState } from 'react';

export const TokenView = ({ onVerified }: { onVerified: () => void }) => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (token.trim().length > 0) { localStorage.setItem("cfbnd_token", token); onVerified(); } else setError("Token inválido"); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
       <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl border shadow-xl animate-in zoom-in-95 duration-300">
          <div className="text-center">
             <div className="mx-auto h-20 w-20 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold font-belanosima mb-6 shadow-lg">CF</div>
             <h2 className="text-3xl font-bold font-belanosima tracking-tight text-foreground">CFBND Plataforma</h2>
             <p className="mt-2 text-sm text-muted-foreground">Acceso restringido a personal autorizado.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             <div><input type="password" required className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-input placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm text-center tracking-widest text-xl" placeholder="••••••••" value={token} onChange={(e) => setToken(e.target.value)} /></div>
             {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-2 rounded">{error}</p>}
             <button type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg transition-all hover:scale-[1.02]">Ingresar al Sistema</button>
          </form>
       </div>
    </div>
  );
};