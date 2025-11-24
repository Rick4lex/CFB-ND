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
    <div className="min-h-[100svh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>

       <div className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500 z-10">
          <div className="text-center mb-8">
             <div className="mx-auto h-24 w-24 bg-gradient-to-br from-primary to-orange-400 rounded-3xl flex items-center justify-center text-white text-4xl font-bold font-belanosima mb-6 shadow-xl transform rotate-3">CF</div>
             <h2 className="text-3xl font-bold font-belanosima tracking-tight text-foreground">Bienvenido</h2>
             <p className="mt-2 text-muted-foreground">Ingresa tu credencial de acceso para continuar.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
             <div className="relative group">
                <input 
                    type="password" 
                    required 
                    className="block w-full px-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 placeholder:text-muted-foreground/50 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center tracking-[0.5em] text-2xl font-bold" 
                    placeholder="••••" 
                    value={token} 
                    onChange={(e) => setToken(e.target.value)} 
                />
             </div>
             {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-pulse">{error}</p>}
             <button 
                type="submit" 
                className="w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
            >
                Ingresar al Sistema
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-muted-foreground/60">CFBND Plataforma v2.0 &copy; 2025</p>
       </div>
    </div>
  );
};