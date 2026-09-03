import { useState } from "react";
import { usersService } from "../../services/usersService";
import { useAuthStore } from "../../store/authStore";
import "../../styles/Colors.css";
import "../../styles/forms/LoginForm.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await usersService.login(email, password);
      login(response.data.access_token, response.data.user_id);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h1>Bienvenido</h1>
              <p>Ingresa a tu cuenta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-alert">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>Acceso autorizado solamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
