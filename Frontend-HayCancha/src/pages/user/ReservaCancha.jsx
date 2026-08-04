import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronDown, Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HeaderCliente from './HeaderCliente'; // 1. Importar el header
import './ReservaCancha.css';

const ReservaCancha = () => {
  const { idCancha } = useParams();
  const navigate = useNavigate(); 
  const [cancha, setCancha] = useState(null);
  const [club, setClub] = useState(null); 
  const [cargando, setCargando] = useState(true);
  
  const [paso, setPaso] = useState(1);
  const [diaExpandido, setDiaExpandido] = useState(null); 
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  
  // Estados para autenticación en el paso 2
  const [user, setUser] = useState(null);
  const [esRegistro, setEsRegistro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAuth, setErrorAuth] = useState('');
  const [mensajeExitoAuth, setMensajeExitoAuth] = useState('');

  const [turnosOcupados, setTurnosOcupados] = useState([]);

  const [productosClub, setProductosClub] = useState([]); // Lista de productos del club
  const [extrasSeleccionados, setExtrasSeleccionados] = useState({}); // Lo que va eligiendo el usuario { productoId: cantidad }

  const generarProximosDias = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      
      const fechaBD = fecha.toISOString().split('T')[0]; 
      const nombreDia = fecha.toLocaleDateString('es-AR', { weekday: 'long' }); 
      const numeroDia = fecha.getDate();
      const nombreMes = fecha.toLocaleDateString('es-AR', { month: 'long' }); 

      dias.push({
        fechaBD,
        textoMostrar: `${nombreDia} ${numeroDia} de ${nombreMes}`
      });
    }
    return dias;
  };

  const diasSemana = generarProximosDias();
  const hoyBD = diasSemana[0].fechaBD; 

useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          if (session.user.user_metadata?.full_name) {
            setNombre(session.user.user_metadata.full_name);
          }
        }

        const { data: dataCancha, error: errorCancha } = await supabase
          .from('canchas')
          .select('*')
          .eq('id', idCancha)
          .single();

        if (errorCancha) throw errorCancha;
        setCancha(dataCancha);

        if (dataCancha?.club_id) {
          const { data: dataClub, error: errorClub } = await supabase
            .from('clubes')
            .select('*') // Traemos todo para tener provincia, ciudad e id del club
            .eq('id', dataCancha.club_id)
            .single();
            
          if (!errorClub && dataClub) {
            setClub(dataClub);

            // 👇 BUSCAMOS LOS PRODUCTOS DEL KIOSCO DE ESTE CLUB 👇
            const { data: dataProductos } = await supabase
              .from('productos')
              .select('*')
              .eq('club_id', dataClub.id)
              .eq('activo', true);
            
            setProductosClub(dataProductos || []);
            // 👆 FIN DE LA BÚSQUEDA DE PRODUCTOS 👆
          }
        }

        if (!diaExpandido) setDiaExpandido(hoyBD);

        const { data: turnos, error: errorTurnos } = await supabase
          .from('turnos')
          .select('fecha, hora_inicio')
          .eq('cancha_id', idCancha)
          .gte('fecha', hoyBD); 

        if (errorTurnos) throw errorTurnos;
        setTurnosOcupados(turnos || []);

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [idCancha, hoyBD]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    setMensajeExitoAuth('');
    setGuardando(true);

    try {
      if (esRegistro) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: nombre, rol: 'cliente' },
            emailRedirectTo: window.location.origin
          }
        });
        if (errorRegistro) throw errorRegistro;

        if (data.user && !data.session) {
          setErrorAuth('✅ ¡Cuenta creada! Revisá tu correo para confirmarla e iniciar sesión.');
          setEsRegistro(false);
          return;
        }
        if (data.user) {
          setUser(data.user);
          if (nombre) setNombre(nombre);
        }

      } else {
        const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (errorLogin) throw errorLogin;
        if (data.user) {
          setUser(data.user);
          if (data.user.user_metadata?.full_name) {
            setNombre(data.user.user_metadata.full_name);
          }
        }
      }
    } catch (err) {
      const mensaje = err?.message || 'Ocurrió un error en la autenticación.';
      if (mensaje.includes('Invalid login')) {
        setErrorAuth('Email o contraseña incorrectos.');
      } else {
        setErrorAuth(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    setMensajeExitoAuth('');
    setGuardando(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/actualizar-password',
      });
      if (error) throw error;
      setMensajeExitoAuth('✅ ¡Te enviamos un enlace para restablecer tu contraseña!');
    } catch (err) {
      setErrorAuth('Hubo un problema al enviar el correo. Verificá que esté bien escrito.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      });
      if (error) throw error;
    } catch (err) {
      setErrorAuth('Error al conectar con Google.');
    }
  };

  const generarHorariosDisponibles = (apertura, cierre) => {
    const horarios = [];
    const horaInicioStr = apertura || '08:00';
    const horaFinStr = cierre || '23:00';

    let horaActual = parseInt(horaInicioStr.split(':')[0]); 
    const horaFin = parseInt(horaFinStr.split(':')[0]);    

    while (horaActual < horaFin) {
      horarios.push(`${horaActual.toString().padStart(2, '0')}:00`);
      horaActual++;
    }
    return horarios;
  };

  const horariosBase = cancha ? generarHorariosDisponibles(cancha.hora_apertura, cancha.hora_cierre) : [];

  // Confirmar reserva adaptada estrictamente a tus columnas de Supabase
  const confirmarReserva = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      
      const nombreClienteFinal = nombre || user?.user_metadata?.full_name || user?.email || 'Cliente';

      // 🛒 CONVERTIMOS LOS EXTRAS SELECCIONADOS A UN FORMATO LIMPIO PARA GUARDAR EN JSONB
      const extrasArray = Object.entries(extrasSeleccionados)
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([idProd, cantidad]) => {
          const prodInfo = productosClub.find(p => p.id === idProd);
          return {
            id: idProd,
            nombre: prodInfo?.nombre || 'Producto',
            precio_unitario: prodInfo?.precio || 0,
            cantidad: cantidad,
            subtotal: (prodInfo?.precio || 0) * cantidad
          };
        });

      const { error } = await supabase
        .from('turnos')
        .insert([{
          cancha_id: idCancha,
          fecha: fechaSeleccionada,
          hora_inicio: horaSeleccionada,
          nombre_cliente: nombreClienteFinal,
          telefono_cliente: telefono,
          extras: extrasArray.length > 0 ? extrasArray : null // Guardamos el JSON acá
        }]);

      if (error) throw error;
      setPaso(3); 
    } catch (error) {
      console.error("Error al guardar la reserva:", error);
      alert("Hubo un error al procesar el turno. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarTurno = (fecha, hora) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(hora);
  };

  const obtenerRutaVuelta = () => {
    if (club && club.provincia && club.ciudad) {
      return `/explorar/${encodeURIComponent(club.provincia)}/${encodeURIComponent(club.ciudad)}`;
    }
    return '/'; 
  };

  if (cargando) return <div className="estado-carga">Cargando disponibilidad...</div>;
  if (!cancha) return <div className="estado-carga">Cancha no encontrada</div>;

  return (
    <div className="reserva-container">
      
      <div className="header-reserva">
        <button onClick={() => navigate(-1)} className="btn-volver-reserva">
          <ArrowLeft size={24} />
        </button>
        <h1 className="titulo-cancha">{cancha.nombre}</h1>
      </div>

      <div className="stepper-reserva">
        <div className={`stepper-item ${paso >= 1 ? 'activo' : ''}`}>
          <span className="stepper-numero">1</span>
          <span className="stepper-label">Horario</span>
        </div>
        <div className="stepper-linea"></div>
        <div className={`stepper-item ${paso >= 2 ? 'activo' : ''}`}>
          <span className="stepper-numero">2</span>
          <span className="stepper-label">Cuenta y Datos</span>
        </div>
        <div className="stepper-linea"></div>
        <div className={`stepper-item ${paso >= 3 ? 'activo' : ''}`}>
          <span className="stepper-numero">3</span>
          <span className="stepper-label">Listo</span>
        </div>
      </div>

      {paso === 1 && (
        <div className="paso-horarios">
          <h2 className="titulo-paso">Elegí día y horario</h2>
          
          <div className="lista-dias">
            {diasSemana.map((dia) => {
              const estaAbierto = diaExpandido === dia.fechaBD;
              
              return (
                <div key={dia.fechaBD} className="dia-card">
                  <div 
                    onClick={() => setDiaExpandido(estaAbierto ? null : dia.fechaBD)}
                    className={`dia-header ${estaAbierto ? 'abierto' : ''}`}
                  >
                    <span className="dia-texto">{dia.textoMostrar}</span>
                    <ChevronDown size={20} className={`flecha-icono ${estaAbierto ? 'abierta' : ''}`} />
                  </div>

                  {estaAbierto && (
                    <div className="animacion-acordeon">
                      {horariosBase.map((hora) => {
                        const estaOcupado = turnosOcupados.some(t => t.fecha === dia.fechaBD && t.hora_inicio === hora);
                        const estaSeleccionado = fechaSeleccionada === dia.fechaBD && horaSeleccionada === hora;

                        let claseBoton = 'btn-hora disponible';
                        if (estaOcupado) claseBoton = 'btn-hora ocupado';
                        else if (estaSeleccionado) claseBoton = 'btn-hora seleccionado';

                        return (
                          <button
                            key={hora}
                            disabled={estaOcupado}
                            onClick={() => seleccionarTurno(dia.fechaBD, hora)}
                            className={claseBoton}
                          >
                            <span>{hora}</span>
                            <span className="hora-estado">
                              {estaOcupado ? 'Ocupado' : estaSeleccionado ? 'Elegido' : 'Libre'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {horaSeleccionada && (
            <button onClick={() => setPaso(2)} className="btn-continuar">
              Continuar
            </button>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="paso-datos">
          <h2 className="titulo-paso">
            {user ? 'Confirmar tus datos' : (mostrarRecuperar ? 'Recuperar Contraseña' : (esRegistro ? 'Creá tu cuenta' : 'Iniciá sesión para reservar'))}
          </h2>
          
          <div className="info-reserva-box">
            <p className="info-reserva-texto">
              Turno seleccionado: <strong>{fechaSeleccionada?.split('-').reverse().join('/')}</strong> a las <strong>{horaSeleccionada} hs</strong>
            </p>
          </div>

          {errorAuth && <div className="alerta-error-cli" style={{color: '#ef4444', marginBottom: '15px', fontSize: '0.9rem'}}>{errorAuth}</div>}
          {mensajeExitoAuth && <div className="alerta-error-cli exito" style={{color: '#16a34a', marginBottom: '15px', fontSize: '0.9rem'}}>{mensajeExitoAuth}</div>}

          {!user ? (
            <div>
              {mostrarRecuperar ? (
                <form onSubmit={handleRecuperarPassword}>
                  <div className="form-group">
                    <label className="form-label">Email de recuperación</label>
                    <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                      <Mail size={18} style={{position: 'absolute', left: '12px', color: '#64748b'}} />
                      <input 
                        type="email" 
                        required 
                        placeholder="tu@correo.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        style={{paddingLeft: '40px'}}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-confirmar" disabled={guardando} style={{marginTop: '10px'}}>
                    {guardando ? 'Enviando...' : 'Enviar enlace'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setMostrarRecuperar(false); setErrorAuth(''); setMensajeExitoAuth(''); }} 
                    className="btn-atras"
                    style={{width: '100%', marginTop: '10px', textAlign: 'center'}}
                  >
                    Volver a iniciar sesión
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit}>
                  {esRegistro && (
                    <div className="form-group">
                      <label className="form-label">Nombre y Apellido</label>
                      <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                        <UserIcon size={18} style={{position: 'absolute', left: '12px', color: '#64748b'}} />
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: Lucas Pérez" 
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="form-input"
                          style={{paddingLeft: '40px'}}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                      <Mail size={18} style={{position: 'absolute', left: '12px', color: '#64748b'}} />
                      <input 
                        type="email" 
                        required 
                        placeholder="tu@correo.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        style={{paddingLeft: '40px'}}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                      <Lock size={18} style={{position: 'absolute', left: '12px', color: '#64748b'}} />
                      <input 
                        type="password" 
                        required 
                        placeholder="Mínimo 6 caracteres" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        className="form-input"
                        style={{paddingLeft: '40px'}}
                      />
                    </div>
                    {!esRegistro && (
                      <div style={{textAlign: 'right', marginTop: '5px'}}>
                        <button type="button" onClick={() => { setMostrarRecuperar(true); setErrorAuth(''); }} style={{background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '0.85rem'}}>
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="btn-group" style={{marginTop: '15px'}}>
                    <button type="button" onClick={() => setPaso(1)} className="btn-atras">
                      Atrás
                    </button>
                    <button type="submit" className="btn-confirmar" disabled={guardando}>
                      {guardando ? 'Procesando...' : (esRegistro ? 'Registrarse' : 'Iniciar Sesión')}
                    </button>
                  </div>

                  <div style={{textAlign: 'center', margin: '20px 0 10px', color: '#64748b', fontSize: '0.9rem'}}>O ingresá con</div>

                  <button onClick={handleGoogleLogin} type="button" style={{width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer'}}>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" />
                    Google
                  </button>

                  <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9rem'}}>
                    {esRegistro ? '¿Ya tenés una cuenta?' : '¿No tenés una cuenta?'} {' '}
                    <button type="button" onClick={() => { setEsRegistro(!esRegistro); setErrorAuth(''); }} style={{background: 'none', border: 'none', color: '#16a34a', fontWeight: 'bold', cursor: 'pointer'}}>
                      {esRegistro ? 'Iniciá sesión' : 'Registrate gratis'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={confirmarReserva}>
              <p style={{marginBottom: '15px', color: '#475162', fontSize: '0.95rem'}}>
                Conectado como: <strong>{user.email}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Nombre y Apellido</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono (WhatsApp)</label>
                <input 
                  type="tel" 
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 3564..."
                  className="form-input"
                  required
                />
              </div>

              {/* 👇 SECCIÓN DEL KIOSCO / EXTRAS QUE SE AGREGA ACÁ 👇 */}
              {productosClub.length > 0 && (
                <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>¿Te falta algo para el partido? 🥤</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>Agregá bebidas o alquileres para tenerlos listos al llegar.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productosClub.map(prod => {
                      const cantidadActual = extrasSeleccionados[prod.id] || 0;
                      return (
                        <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{prod.nombre}</span>
                            <span style={{ display: 'block', color: '#16a34a', fontSize: '0.85rem', fontWeight: 'bold' }}>${prod.precio}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                              type="button"
                              onClick={() => setExtrasSeleccionados(prev => ({ ...prev, [prod.id]: Math.max(0, cantidadActual - 1) }))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600' }}>{cantidadActual}</span>
                            <button 
                              type="button"
                              onClick={() => setExtrasSeleccionados(prev => ({ ...prev, [prod.id]: cantidadActual + 1 }))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #22c55e', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* 👆 FIN DE LA SECCIÓN DEL KIOSCO 👆 */}

              <div className="btn-group" style={{marginTop: '20px'}}>
                <button type="button" onClick={() => setPaso(1)} className="btn-atras">
                  Atrás
                </button>
                <button type="submit" className="btn-confirmar" disabled={!telefono || !nombre || guardando}>
                  {guardando ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {paso === 3 && (
        <div className="paso-exito">
          <CheckCircle size={60} color="#22c55e" className="icono-exito" />
          <h2 className="titulo-exito">¡Reserva Confirmada!</h2>
          <p className="texto-exito">Te esperamos el {fechaSeleccionada?.split('-').reverse().join('/')} a las {horaSeleccionada} hs. ¡A jugar!</p>
          
          <div style={{display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center'}}>
            <Link to="/mis-reservas" className="btn-confirmar" style={{textDecoration: 'none', padding: '12px 24px'}}>
              Ver mis reservas
            </Link>
            <Link to={obtenerRutaVuelta()} className="btn-atras" style={{textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center'}}>
              Volver a los clubes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservaCancha;