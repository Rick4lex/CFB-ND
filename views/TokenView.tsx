import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TokenView = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (token.trim().length > 0) { 
          localStorage.setItem("cfbnd_token", token); 
          navigate('/app/dashboard');
      } else {
          setError("Token inválido"); 
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]"></div>
       </div>

       <div className="w-full max-w-md space-y-8 p-8 md:p-10 bg-card/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500 relative z-10">
          <div className="text-center">
             <div className="mx-auto h-24 w-24 bg-gradient-to-tr from-primary to-orange-400 rounded-3xl flex items-center justify-center text-primary-foreground text-4xl font-bold font-belanosima mb-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">CF</div>
             <h2 className="text-3xl font-bold font-belanosima tracking-tight text-foreground">CFBND Plataforma</h2>
             <p className="mt-2 text-sm text-muted-foreground">Acceso restringido a personal autorizado.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             <div className="space-y-2">
                 <input 
                    type="password" 
                    required 
                    className="appearance-none rounded-2xl relative block w-full px-4 py-4 border border-input placeholder-muted-foreground/50 text-foreground bg-background/50 focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-center tracking-[0.5em] text-2xl font-bold" 
                    placeholder="••••" 
                    value={token} 
                    onChange={(e) => setToken(e.target.value)} 
                 />
             </div>
             {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-xl animate-in shake">{error}</p>}
             <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/30 shadow-lg shadow-primary/25 transition-all duration-200">
                 Ingresar al Sistema
             </button>
          </form>
          <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground/60">Sistema de Gestión Interna v2.0</p>
          </div>
       </div>
    </div>
  );
};