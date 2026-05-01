import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onAuthClick: () => void;
}

export default function Header({ onAuthClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar is-white is-fixed-top" role="navigation" aria-label="main navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
      <div className="navbar-brand" style={{ flex: 'none', display: 'flex', alignItems: 'center' }}>
        <a className="navbar-item" href="/" style={{ padding: 0 }}>
          <i className="fas fa-headphones" style={{ color: '#6200EE', marginRight: '0.5rem', fontSize: '1.2rem' }}></i>
          <strong style={{ fontSize: '1.1rem' }}>AndrewSound</strong>
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <div className="dropdown is-right is-hoverable">
            <div className="dropdown-trigger">
              <button className="button is-text" aria-haspopup="true" aria-controls="dropdown-menu">
                <i className="fas fa-user-circle" style={{ marginRight: '0.4rem', fontSize: '1.2rem', color: '#6200EE' }}></i>
                <span className="is-hidden-mobile">{user.name}</span>
              </button>
            </div>
            <div className="dropdown-menu" id="dropdown-menu" role="menu">
              <div className="dropdown-content">
                <a className="dropdown-item has-text-danger" onClick={logout}>
                  <i className="fas fa-sign-out-alt" style={{ marginRight: '0.4rem' }}></i>
                  Logout
                </a>
              </div>
            </div>
          </div>
        ) : (
          <button className="button is-link is-rounded is-small" onClick={onAuthClick}>
            <span className="icon"><i className="fas fa-sign-in-alt"></i></span>
            <span>Log In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
