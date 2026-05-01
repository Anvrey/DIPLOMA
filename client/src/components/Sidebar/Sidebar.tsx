interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreatePlaylist: () => void;
  onUpload: () => void;
}

export default function Sidebar({ activeView, onViewChange, onCreatePlaylist, onUpload }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <p className="menu-label">Your Library</p>
      <ul className="menu-list">
        <li>
          <a className={activeView === 'home' ? 'is-active' : ''} onClick={() => onViewChange('home')}>
            <i className="fas fa-home"></i> Home
          </a>
        </li>
        <li>
          <a className={activeView === 'search' ? 'is-active' : ''} onClick={() => onViewChange('search')}>
            <i className="fas fa-search"></i> Discover
          </a>
        </li>
        <li>
          <a className={activeView === 'playlists' ? 'is-active' : ''} onClick={() => onViewChange('playlists')}>
            <i className="fas fa-list"></i> Playlists
          </a>
        </li>
        <li>
          <a className={activeView === 'browse' ? 'is-active' : ''} onClick={() => onViewChange('browse')}>
            <i className="fas fa-compact-disc"></i> Browse
          </a>
        </li>
      </ul>

      <button className="button is-danger is-rounded sidebar-create-btn" onClick={onCreatePlaylist}>
        <span className="icon"><i className="fas fa-plus"></i></span>
        <span>Create Playlist</span>
      </button>

      <button className="button is-info is-rounded is-light sidebar-create-btn" onClick={onUpload} style={{ marginTop: '0.5rem' }}>
        <span className="icon"><i className="fas fa-cloud-upload-alt"></i></span>
        <span>Upload Track</span>
      </button>
    </aside>
  );
}
