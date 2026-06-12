export default function PrivacyPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf8f4; font-family: var(--font-instrument-sans), system-ui, sans-serif; }
        main { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
        h1 { font-family: var(--font-fraunces), serif; font-size: 36px; font-weight: 600; color: #1a3a2a; margin-bottom: 8px; }
        .updated { font-size: 14px; color: #8a7a68; margin-bottom: 32px; }
        h2 { font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 600; color: #1a3a2a; margin-top: 32px; margin-bottom: 12px; }
        p { font-size: 15px; color: #3a3028; line-height: 1.7; margin-bottom: 14px; }
        ul { margin: 0 0 14px 20px; }
        li { font-size: 15px; color: #3a3028; line-height: 1.7; margin-bottom: 6px; }
        a { color: #1a3a2a; }
        hr { border: none; border-top: 1px solid #e0d8c8; margin: 12px 0; }
      `}</style>
      <main>
        <h1>Política de Privacidad</h1>
        <p className="updated">Última actualización: 12 de junio de 2026</p>

        <h2>1. ¿Quién es el responsable de tus datos?</h2>
        <p>
          <strong>Juanita La Legal</strong> es un servicio de orientación legal online operado por
          Francisco Vera (en adelante, &ldquo;el responsable&rdquo;). Al usar nuestro sitio web
          <a href="https://juanitalalegal.cl"> juanitalalegal.cl</a>, confías tu información personal
          al responsable, quien se compromete a protegerla conforme a la Ley N° 19.628 sobre
          Protección de la Vida Privada y el Reglamento General de Protección de Datos (RGPD)
          de la Unión Europea cuando corresponda.
        </p>

        <h2>2. Datos que recopilamos</h2>
        <p>Recopilamos los siguientes datos personales cuando interactúas con nuestro sitio:</p>
        <ul>
          <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, sistema operativo, páginas visitadas y duración de la visita.</li>
          <li><strong>Datos de interacción:</strong> clics, movimientos del mouse, scroll y patrones de navegación (a través de Microsoft Clarity).</li>
          <li><strong>Datos de conversación:</strong> el texto que escribes en la consulta legal con Juanita.</li>
          <li><strong>Datos de pago:</strong> solo el correo electrónico asociado a tu transacción. No almacenamos datos de tarjetas de crédito o débito.</li>
        </ul>

        <h2>3. Finalidad del tratamiento</h2>
        <p>Tus datos se utilizan exclusivamente para:</p>
        <ul>
          <li>Orientarte legalmente respondiendo tu consulta.</li>
          <li>Procesar tu pago y activar tu sesión.</li>
          <li>Mejorar nuestro sitio web y la experiencia de usuario.</li>
          <li>Cumplir obligaciones legales y fiscales.</li>
        </ul>
        <p>
          No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines de
          marketing directo o publicidad.
        </p>

        <h2>4. Microsoft Clarity</h2>
        <p>
          Utilizamos <strong>Microsoft Clarity</strong> para analizar cómo los usuarios interactúan
          con nuestro sitio web. Esta herramienta captura grabaciones de sesiones y mapas de calor
          que nos permiten entender el comportamiento de navegación y mejorar la experiencia de uso
          de juanitalalegal.cl. Los datos recopilados incluyen movimientos del mouse, clics y
          patrones de navegación. Esta información es utilizada exclusivamente para optimizar el
          sitio y mejorar nuestros servicios.
        </p>
        <p>
          Para más información sobre cómo Microsoft recopila y protege tus datos, visita la
          <a href="https://privacy.microsoft.com/es-mx/privacystatement" target="_blank" rel="noopener noreferrer">
            Política de Privacidad de Microsoft
          </a>.
        </p>

        <h2>5. Google Analytics y Meta Pixel</h2>
        <p>
          Utilizamos <strong>Google Analytics</strong> y <strong>Meta Pixel</strong> para medir el
          tráfico y la efectividad de nuestras campañas. Estas herramientas recopilan datos
          anónimos de navegación. Puedes desactivar Google Analytics mediante la
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            extensión de inhabilitación de Google Analytics
          </a>.
        </p>

        <h2>6. Base legal del tratamiento</h2>
        <p>Tratamos tus datos personales basándonos en:</p>
        <ul>
          <li><strong>Consentimiento:</strong> al usar nuestro sitio, aceptas el uso de cookies y herramientas de análisis.</li>
          <li><strong>Ejecución contractual:</strong> para procesar tu pago y prestarte el servicio de orientación legal.</li>
          <li><strong>Interés legítimo:</strong> mejorar nuestro sitio y servicios.</li>
        </ul>

        <h2>7. Conservación de datos</h2>
        <p>
          Conservamos tus datos personales solo durante el tiempo necesario para cumplir las
          finalidades descritas en esta política. Las grabaciones de sesiones en Clarity se
          conservan por un máximo de 24 meses. Los datos de conversación se eliminan 90 días
          después de tu última interacción.
        </p>

        <h2>8. Tus derechos</h2>
        <p>Puedes ejercer los siguientes derechos en cualquier momento:</p>
        <ul>
          <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos personales.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para fines de análisis.</li>
        </ul>
        <p>
          Para ejercer tus derechos, escríbenos a: <strong>hola@juanitalalegal.cl</strong>.
          Responderemos a tu solicitud dentro de los 15 días hábiles siguientes.
        </p>

        <h2>9. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos cualquier
          cambio publicando la nueva versión en esta página con la fecha de actualización
          correspondiente. Te recomendamos revisar esta página periódicamente.
        </p>

        <hr />
        <p style={{ fontSize: '13px', color: '#8a7a68', marginTop: 24 }}>
          Si tienes preguntas sobre esta Política de Privacidad, contáctanos en
          <strong> hola@juanitalalegal.cl</strong>.
        </p>
      </main>
    </>
  );
}
