import './MobileNav.scss';

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <nav className="mobile-nav">
      <button 
        className={`mobile-nav-item ${activeView === 'home' ? 'is-active' : ''}`}
        onClick={() => onViewChange('home')}
      >
        <i className="fas fa-home"></i>
        <span>Home</span>
      </button>
      
      <button 
        className={`mobile-nav-item ${activeView === 'browse' ? 'is-active' : ''}`}
        onClick={() => onViewChange('browse')}
      >
        <i className="fas fa-compass"></i>
        <span>Browse</span>
      </button>

      <button 
        className={`mobile-nav-item ${activeView === 'search' ? 'is-active' : ''}`}
        onClick={() => onViewChange('search')}
      >
        <i className="fas fa-search"></i>
        <span>Search</span>
      </button>
      
      <button 
        className={`mobile-nav-item ${activeView === 'playlists' ? 'is-active' : ''}`}
        onClick={() => onViewChange('playlists')}
      >
        <i className="fas fa-list"></i>
        <span>Playlists</span>
      </button>
    </nav>
  );
}
