import "../../styles/common/Sidebar.css";

export default function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
}) {
  const menuItems = [
    { id: "licitaciones", label: "Licitaciones", icon: "📋" },
    { id: "clientes", label: "Clientes", icon: "👥" },
    { id: "productos", label: "Productos", icon: "📦" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button
          className={`collapse-btn ${collapsed ? "is-collapsed" : ""}`}
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Contraer"}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
            title={collapsed ? item.label : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && <p>Sistema de Gestión de Licitaciones</p>}
      </div>
    </aside>
  );
}
