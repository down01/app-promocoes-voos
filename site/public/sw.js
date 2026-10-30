// Recebe os avisos de promoção mandados pelo robô (avisos.py → enviar_push)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const aviso = event.data.json();
  event.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.texto,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { link: aviso.link || "/alertas" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.link));
});
