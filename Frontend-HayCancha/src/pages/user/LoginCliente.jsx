import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Mail, Lock, User as UserIcon, CalendarDays } from 'lucide-react';
import './LoginCliente.css';

const LoginCliente = () => {
  const navigate = useNavigate();
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esRegistro) {
        // --- CREAR CUENTA ---
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: nombre,
              rol: 'cliente' // Guardamos que es un cliente
            }
          }
        });
        
        if (errorRegistro) throw errorRegistro;
        
        // NUEVO: Verificamos si Supabase pide confirmación por correo
        if (data.user && !data.session) {
          setError('✅ ¡Cuenta creada! Revisá tu correo (y el spam) para confirmar tu cuenta y poder entrar.');
          setEsRegistro(false); // Lo mandamos a la pestaña de Iniciar Sesión
          return;
        }

        // Si sale bien y no pide confirmación, lo mandamos a elegir ciudad
        if (data.user) navigate('/seleccionar-ubicacion');

      } else {
        // --- INICIAR SESIÓN ---
        const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (errorLogin) throw errorLogin;

        if (data.user) navigate('/seleccionar-ubicacion');
      }
    } catch (err) {
      console.error("Detalle del error:", err);
      if (err.message.includes('Invalid login')) setError('Email o contraseña incorrectos.');
      else if (err.message.includes('already registered')) setError('Este email ya tiene una cuenta.');
      else setError('Error: ' + err.message); // Acá te va a mostrar el error exacto si hay otro problema
    } finally {
      setCargando(false);
    }
  };const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esRegistro) {
        // --- CREAR CUENTA ---
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: nombre,
              rol: 'cliente' // Guardamos que es un cliente
            }
          }
        });
        
        if (errorRegistro) throw errorRegistro;
        
        // NUEVO: Verificamos si Supabase pide confirmación por correo
        if (data.user && !data.session) {
          setError('✅ ¡Cuenta creada! Revisá tu correo (y el spam) para confirmar tu cuenta y poder entrar.');
          setEsRegistro(false); // Lo mandamos a la pestaña de Iniciar Sesión
          return;
        }

        // Si sale bien y no pide confirmación, lo mandamos a elegir ciudad
        if (data.user) navigate('/seleccionar-ubicacion');

      } else {
        // --- INICIAR SESIÓN ---
        const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (errorLogin) throw errorLogin;

        if (data.user) navigate('/seleccionar-ubicacion');
      }
    } catch (err) {
      console.error("Detalle del error:", err);
      if (err.message.includes('Invalid login')) setError('Email o contraseña incorrectos.');
      else if (err.message.includes('already registered')) setError('Este email ya tiene una cuenta.');
      else setError('Error: ' + err.message); // Acá te va a mostrar el error exacto si hay otro problema
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Por ahora solo muestra un mensaje, luego lo configuraremos bien en Supabase
    alert("El inicio con Google se activará próximamente. Por favor, usá tu email y contraseña.");
  };

  return (
    <div className="login-cli-container">
      
      <button onClick={() => navigate('/')} className="btn-volver-flotante">
        <ArrowLeft size={20} /> Volver
      </button>

      <div className="login-cli-card">
        <div className="login-cli-header">
          <div className="icono-cli-wrapper">
            <CalendarDays size={32} />
          </div>
          <h2>{esRegistro ? 'Creá tu cuenta' : '¡Hola de nuevo!'}</h2>
          <p>{esRegistro ? 'Registrate para empezar a reservar canchas' : 'Ingresá a tu cuenta para gestionar tus turnos'}</p>
        </div>

        {error && <div className="alerta-error-cli">{error}</div>}

        <form onSubmit={handleSubmit} className="login-cli-form">
          
          {esRegistro && (
            <div className="form-group-cli">
              <label>Nombre y Apellido</label>
              <div className="input-box-cli">
                <UserIcon size={18} className="input-icon-cli" />
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Lucas Pérez" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group-cli">
            <label>Email</label>
            <div className="input-box-cli">
              <Mail size={18} className="input-icon-cli" />
              <input 
                type="email" 
                required 
                placeholder="tu@correo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group-cli">
            <label>Contraseña</label>
            <div className="input-box-cli">
              <Lock size={18} className="input-icon-cli" />
              <input 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            {!esRegistro && (
              <div className="olvide-pass-link">
                <button type="button">¿Olvidaste tu contraseña?</button>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primario-cli" disabled={cargando}>
            {cargando ? 'Procesando...' : (esRegistro ? 'Registrarme' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="divisor-cli">
          <span>O ingresá con</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn-google-cli" type="button">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          Google
        </button>

        <div className="login-cli-footer">
          <p>
            {esRegistro ? '¿Ya tenés una cuenta?' : '¿No tenés una cuenta?'}
            <button 
              onClick={() => { setEsRegistro(!esRegistro); setError(''); }} 
              className="btn-switch-modo"
            >
              {esRegistro ? 'Iniciá sesión' : 'Registrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginCliente;