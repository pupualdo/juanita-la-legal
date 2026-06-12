export default function Footer() {
  return (
    <footer
      style={{
        background: '#f0ece2',
        borderTop: '1px solid #e0d8c8',
        padding: '40px 20px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#6a5e50',
        lineHeight: 1.6,
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <p style={{ marginBottom: 16 }}>
          Mejoramos nuestros productos usando{' '}
          <strong>Microsoft Clarity</strong> para ver cómo usas nuestro sitio.
          Al usarlo, aceptas que nosotros y Microsoft podamos recopilar y usar
          estos datos.
        </p>
        <p>
          <a
            href="https://privacy.microsoft.com/es-mx/privacystatement"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1a3a2a', textDecoration: 'underline' }}
          >
            Política de Privacidad de Microsoft
          </a>
        </p>
      </div>
    </footer>
  );
}
