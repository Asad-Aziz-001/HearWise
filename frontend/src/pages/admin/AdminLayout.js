import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f8ff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: '32px 40px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}